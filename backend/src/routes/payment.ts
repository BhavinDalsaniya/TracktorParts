/**
 * Payment routes - Razorpay integration
 * Optional online payment with webhook handling
 */

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ApiError } from '@/middleware/errorHandler';
import { authenticate, requireRole } from '@/middleware/auth';
import { razorpayService, createPaymentOrder, verifyAndConfirmOrder, handlePaymentFailure } from '@/services/razorpay';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createPaymentOrderSchema = z.object({
  addressId: z.string().min(1),
  couponCode: z.string().optional(),
});

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

const guestOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number(),
    product: z.object({
      id: z.string(),
      name: z.string(),
      nameGu: z.string(),
      price: z.union([z.string(), z.number()]),
      stock: z.number(),
    }),
  })),
  subtotal: z.number(),
  shipping: z.number(),
  tax: z.number(),
  total: z.number(),
  customerDetails: z.object({
    fullName: z.string(),
    email: z.string().optional(),
    mobileNumber: z.string(),
    address: z.string(),
    state: z.string(),
    district: z.string(),
    pincode: z.string(),
  }),
  paymentMethod: z.string().default('online'),
});

const guestPaymentOrderSchema = z.object({
  orderId: z.string(),
  amount: z.number(),
  customerDetails: z.object({
    fullName: z.string(),
    email: z.string().optional(),
    mobileNumber: z.string(),
  }),
});

// ============================================
// PUBLIC ENDPOINTS
// ============================================

/**
 * @route   POST /api/payment/guest-order
 * @desc    Create guest order (no login required)
 * @access  Public
 */
router.post(
  '/guest-order',
  asyncHandler(async (req, res) => {
    const data = guestOrderSchema.parse(req.body);

    // Verify stock
    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { stock: true, name: true },
      });

      if (!product) {
        throw new ApiError(404, `પ્રોડક્ટ મળ્યું નથી: ${item.product.name}`);
      }
      if (product.stock < item.quantity) {
        throw new ApiError(400, `${item.product.name} સ્ટોકમાં ઉપલબ્ધ નથી`);
      }
    }

    // Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(6, '0')}`;

    // Create guest order
    const order = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          subtotal: data.subtotal,
          shipping: data.shipping,
          tax: data.tax,
          discount: 0,
          total: data.total,
          paymentMethod: data.paymentMethod === 'online' ? ('ONLINE_PAYMENT' as const) : ('COD' as const),
          paymentStatus: 'PENDING',
          status: 'PENDING',
          shippingAddress: {
            fullName: data.customerDetails.fullName,
            phone: data.customerDetails.mobileNumber,
            email: data.customerDetails.email || '',
            addressLine1: data.customerDetails.address,
            city: data.customerDetails.district,
            district: data.customerDetails.district,
            state: data.customerDetails.state,
            pincode: data.customerDetails.pincode,
          },
          items: {
            create: data.items.map((item) => {
              const price = typeof item.product.price === 'string'
                ? parseFloat(item.product.price)
                : item.product.price;
              return {
                productId: item.productId,
                productName: item.product.name,
                productNameGu: item.product.nameGu,
                sku: item.product.id,
                image: '',
                quantity: item.quantity,
                unitPrice: price,
                tax: Math.round((price * item.quantity * 18) / 100),
                discount: 0,
                total: price * item.quantity,
              };
            }),
          },
        },
        select: { id: true, orderNumber: true, total: true },
      });

      // Deduct inventory
      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        });

        if (product && product.stock >= item.quantity) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
              soldCount: { increment: item.quantity },
            },
          });

          // Log inventory
          await tx.inventoryLog.create({
            data: {
              productId: item.productId,
              type: 'SALE',
              quantity: -item.quantity,
              stockBefore: product.stock,
              stockAfter: product.stock - item.quantity,
              referenceId: order.id,
              referenceType: 'ORDER',
            },
          });
        }
      }

      return order;
    });

    logger.info(`Guest order created: ${orderNumber}`);

    res.json({
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: Number(order.total),
      },
    });
  })
);

/**
 * @route   POST /api/payment/create-order-guest
 * @desc    Create Razorpay order for guest checkout
 * @access  Public
 */
router.post(
  '/create-order-guest',
  asyncHandler(async (req, res) => {
    const data = guestPaymentOrderSchema.parse(req.body);

    if (!razorpayService.isEnabled()) {
      throw new ApiError(400, 'ઓનલાઇન ચુકવણી હમણારું ઉપલબ્ધ નથી');
    }

    // Create Razorpay order
    const paymentOrder = await createPaymentOrder(
      data.orderId,
      data.amount,
      {
        name: data.customerDetails.fullName,
        phone: data.customerDetails.mobileNumber,
        email: data.customerDetails.email,
      }
    );

    if (!paymentOrder.razorpayOrder) {
      throw new ApiError(500, 'પેમેન્ટ ઓર્ડર બનાવવામાં નિષ્ફળ');
    }

    res.json({
      success: true,
      data: {
        orderId: data.orderId,
        razorpayOrderId: paymentOrder.razorpayOrder.id,
        amountInPaisa: paymentOrder.amountInPaisa,
        keyId: paymentOrder.keyId,
      },
    });
  })
);

/**
 * @route   GET /api/payment/methods
 * @desc    Get available payment methods
 * @access  Public
 */
router.get(
  '/methods',
  asyncHandler(async (req, res) => {
    const methods = razorpayService.getAvailableMethods();

    res.json({
      success: true,
      data: {
        methods: methods.map((method) => ({
          id: method,
          name: method === 'cod' ? 'કેશ ઓન ડિલિવરી' :
                 method === 'upi' ? 'UPI' :
                 method === 'card' ? 'કાર્ડ/નેટબેંકિંગ' : method,
        })),
        razorpayEnabled: methods.length > 1,
      },
    });
  })
);

// ============================================
// PROTECTED ENDPOINTS
// ============================================

/**
 * @route   POST /api/payment/create-order
 * @desc    Create payment order (for online payment)
 * @access  Private
 */
router.post(
  '/create-order',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = createPaymentOrderSchema.parse(req.body);

    // Get cart and calculate total
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user!.id },
      select: {
        items: {
          select: {
            productId: true,
            product: { select: { id: true, name: true, nameGu: true, stock: true } },
            quantity: true,
            unitPrice: true,
          },
        },
        couponId: true,
        subtotal: true,
        discount: true,
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, 'કાર્ટ ખાલી છે');
    }

    // Check stock
    for (const item of cart.items) {
      if (item.quantity > item.product.stock) {
        throw new ApiError(400, `${item.product.name} સ્ટોકમાં ઉપલબ્ધ નથી`);
      }
    }

    // Get address
    const address = await prisma.address.findFirst({
      where: { id: data.addressId, userId: req.user!.id },
    });

    if (!address) {
      throw new ApiError(404, 'સરનામું મળ્યું નથી');
    }

    // Calculate totals
    const subtotal = Number(cart.subtotal);
    const discount = Number(cart.discount);
    const shipping = subtotal >= 999 ? 0 : 50;
    const tax = Math.round((subtotal * 18) / 100);
    const total = subtotal - discount + shipping + tax;

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { name: true, phone: true, email: true },
    });

    if (!user) {
      throw new ApiError(404, 'વપરાશકર્તા મળ્યો નથી');
    }

    // Check if Razorpay is enabled
    if (!razorpayService.isEnabled()) {
      res.json({
        success: true,
        data: {
          onlinePaymentAvailable: false,
          message: 'ઓનલાઇન ચુકવણી હમણારું ઉપલબ્ધ નથી. COD પસંદ કરો.',
        },
      });
      return;
    }

    // Create temporary order (PENDING)
    const orderCount = await prisma.order.count();
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(6, '0')}`;

    const order = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: req.user!.id,
          subtotal,
          shipping,
          tax,
          discount,
          couponDiscount: discount,
          total,
          paymentMethod: 'ONLINE_PAYMENT',
          paymentStatus: 'PENDING',
          shippingAddressId: data.addressId,
          items: {
            create: cart.items.map((item) => ({
              productId: item.product.id,
              productName: item.product.name,
              productNameGu: item.product.nameGu,
              sku: item.product.name,
              image: '',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              tax: Math.round((Number(item.unitPrice) * item.quantity * 18) / 100),
              discount: 0,
              total: Number(item.unitPrice) * item.quantity,
            })),
          },
          couponId: cart.couponId,
        },
        select: { id: true, orderNumber: true, total: true },
      });

      return order;
    });

    // Create Razorpay order
    const paymentOrder = await createPaymentOrder(order.id, total, {
      name: user.name,
      phone: user.phone,
      email: user.email || undefined,
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: total,
        amountInPaisa: paymentOrder.amountInPaisa,
        currency: 'INR',
        razorpayOrderId: paymentOrder.razorpayOrder?.id,
        keyId: paymentOrder.keyId,
        companyName: process.env.COMPANY_NAME || 'ટ્રેક્ટર પાર્ટ્સ',
        description: `${orderNumber} - ટ્રેક્ટર પાર્ટ્સ`,
      },
    });
  })
);

/**
 * @route   POST /api/payment/verify
 * @desc    Verify payment and confirm order
 * @access  Public (webhook)
 */
router.post(
  '/verify',
  asyncHandler(async (req, res) => {
    const params = verifyPaymentSchema.parse(req.body);
    const { razorpay_order_id } = params;

    // Find order
    const order = await prisma.order.findFirst({
      where: {
        paymentResponse: {
          path: ['notes'],
          string_contains: razorpay_order_id,
        },
      },
      select: {
        id: true,
        paymentStatus: true,
        status: true,
        total: true,
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'ઓર્ડર મળ્યો નથી',
      });
      return;
    }

    // Verify and confirm
    const result = await verifyAndConfirmOrder(order.id, params);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  })
);

/**
 * @route   POST /api/payment/failed
 * @desc    Handle payment failure
 * @access  Public (webhook redirect)
 */
router.post(
  '/failed',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      razorpay_order_id: z.string(),
      razorpay_payment_id: z.string(),
    });
    const params = schema.parse(req.body);

    // Find order
    const order = await prisma.order.findFirst({
      where: {
        paymentResponse: {
          path: ['notes'],
          string_contains: params.razorpay_order_id,
        },
      },
      select: { id: true },
    });

    if (order) {
      await handlePaymentFailure(order.id, params as any);
    }

    res.json({
      success: false,
      message: 'ચુકવણી નિષ્ફળ થઈ. કૃપા કરીને ફરી પ્રયત્ન કરો.',
      redirectUrl: '/cart',
    });
  })
);

/**
 * @route   POST /api/payment/checkout/cod
 * @desc    Create COD order directly
 * @access  Private
 */
router.post(
  '/checkout/cod',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = createPaymentOrderSchema.parse(req.body);

    // Import order controller
    const { orderController } = await import('@/controllers/order');

    const result = await orderController.createOrder(req.user!.id, {
      addressId: data.addressId,
      paymentMethod: 'COD',
      notes: '',
    });

    res.json(result);
  })
);

/**
 * @route   GET /api/payment/status/:orderId
 * @desc    Check payment status
 * @access  Private
 */
router.get(
  '/status/:orderId',
  authenticate,
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.orderId,
        userId: req.user!.id,
      },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        paymentStatus: true,
        paymentMethod: true,
        status: true,
        paymentId: true,
      },
    });

    if (!order) {
      throw new ApiError(404, 'ઓર્ડર મળ્યો નથી');
    }

    const isPaid = order.paymentStatus === 'COMPLETED';

    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        total: Number(order.total),
        paymentStatus: order.paymentStatus,
        isPaid,
        method: order.paymentMethod,
        status: order.status,
      },
    });
  })
);

/**
 * @route   POST /api/payment/refund/:orderId
 * @desc    Process refund (admin only)
 * @access  Admin
 */
router.post(
  '/refund/:orderId',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      amount: z.number().positive(),
      reason: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      select: { id: true, paymentId: true, total: true, paymentStatus: true, paymentMethod: true },
    });

    if (!order) {
      throw new ApiError(404, 'ઓર્ડર મળ્યો નથી');
    }

    if (order.paymentMethod !== 'ONLINE_PAYMENT' && order.paymentMethod !== 'UPI') {
      throw new ApiError(400, 'ફક્ત ઓનલાઇન ચુકવણી વાળા રિફંડ માટે શકાય છે');
    }

    if (order.paymentStatus !== 'COMPLETED') {
      throw new ApiError(400, 'ચુકવણી પૂર્ણ થઈ નથી');
    }

    // Process refund
    const success = await razorpayService.processRefund(order.paymentId!, data.amount);

    if (success) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'REFUNDED',
          status: 'REFUNDED',
          refundedAt: new Date(),
        },
      });

      logger.info(`Refund processed for order: ${order.id}`);

      res.json({
        success: true,
        message: 'રિફંડ પ્રક્રિયા થઈ',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'રિફંડ પ્રક્રિયા નિષ્ફળ',
      });
    }
  })
);

export default router;
