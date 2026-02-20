/**
 * Order Controller - Mobile optimized
 * Simple checkout, COD default, inventory management
 */

import { prisma } from '@/config/database';
import { ApiError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { generateInvoice } from '@/services/invoice';

// Mobile-friendly order item
const ORDER_ITEM_SELECT = {
  id: true,
  productName: true,
  productNameGu: true,
  sku: true,
  image: true,
  quantity: true,
  unitPrice: true,
  tax: true,
  discount: true,
  total: true,
} as const;

const ORDER_SELECT = {
  id: true,
  orderNumber: true,
  items: {
    select: ORDER_ITEM_SELECT,
  },
  subtotal: true,
  shipping: true,
  tax: true,
  discount: true,
  couponDiscount: true,
  total: true,
  status: true,
  paymentStatus: true,
  paymentMethod: true,
  shippingAddress: true,
  trackingNumber: true,
  courierName: true,
  estimatedDelivery: true,
  customerNotes: true,
  adminNotes: true,
  createdAt: true,
  confirmedAt: true,
  processedAt: true,
  shippedAt: true,
  deliveredAt: true,
  cancelledAt: true,
} as const;

export const orderController = {
  /**
   * List user's orders
   */
  async listUserOrders(userId: string, query: any) {
    const { page = 1, limit = 10, status } = query;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          items: {
            select: {
              productName: true,
              image: true,
              quantity: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  },

  /**
   * Get checkout summary from cart
   */
  async getCheckoutSummary(userId: string) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: {
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            product: {
              select: {
                id: true,
                name: true,
                nameGu: true,
                slug: true,
                thumbnail: true,
                stock: true,
              },
            },
          },
        },
        coupon: {
          select: {
            id: true,
            code: true,
            type: true,
            value: true,
          },
        },
        subtotal: true,
        discount: true,
        total: true,
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, 'કાર્ટ ખાલી છે');
    }

    // Check stock availability
    for (const item of cart.items) {
      if (item.quantity > item.product.stock) {
        throw new ApiError(
          400,
          `${item.product.name} માત્ર ${item.product.stock} ઉપલબ્ધ છે`
        );
      }
    }

    // Get user's addresses
    const addresses = await prisma.address.findMany({
      where: { userId, isDeleted: false },
      select: {
        id: true,
        label: true,
        fullName: true,
        phone: true,
        city: true,
        district: true,
        state: true,
        pincode: true,
        isDefault: true,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    const subtotal = Number(cart.subtotal);
    const discount = Number(cart.discount);
    const shipping = subtotal >= 999 ? 0 : 50;
    const tax = Math.round((subtotal * 18) / 100); // 18% GST
    const total = subtotal - discount + shipping + tax;

    return {
      success: true,
      data: {
        items: cart.items,
        coupon: cart.coupon,
        subtotal,
        discount,
        shipping,
        tax,
        total,
        addresses,
        freeShipping: subtotal >= 999,
      },
    };
  },

  /**
   * Create order from cart
   */
  async createOrder(userId: string, data: { addressId: string; paymentMethod: string; notes?: string }) {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, phone: true },
    });

    if (!user) {
      throw new ApiError(404, 'વપરાશકર્તા મળ્યો નથી');
    }

    // Get cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: {
        id: true,
        items: {
          select: {
            productId: true,
            quantity: true,
            unitPrice: true,
            product: {
              select: {
                name: true,
                nameGu: true,
                sku: true,
                thumbnail: true,
                price: true,
                stock: true,
              },
            },
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

    // Validate stock
    for (const item of cart.items) {
      if (item.quantity > item.product.stock) {
        throw new ApiError(400, `${item.product.name} સ્ટોકમાં ઉપલબ્ધ નથી`);
      }
    }

    // Get address
    const address = await prisma.address.findFirst({
      where: { id: data.addressId, userId },
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

    // Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(6, '0')}`;

    // Create order (transaction for inventory)
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          subtotal,
          shipping,
          tax,
          discount,
          couponDiscount: discount,
          total,
          paymentMethod: data.paymentMethod as any,
          shippingAddressId: data.addressId,
          customerNotes: data.notes,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              productNameGu: item.product.nameGu,
              sku: item.product.sku,
              image: item.product.thumbnail,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              tax: Math.round((Number(item.unitPrice) * item.quantity * 18) / 100),
              discount: 0,
              total: Number(item.unitPrice) * item.quantity,
            })),
          },
          couponId: cart.couponId,
        },
        select: ORDER_SELECT,
      });

      // Update coupon usage
      if (cart.couponId) {
        await tx.coupon.update({
          where: { id: cart.couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Deduct inventory
      for (const item of cart.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        });

        if (!product || product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.product.name}`);
        }

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

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      await tx.cart.update({
        where: { id: cart.id },
        data: {
          couponId: null,
          subtotal: 0,
          discount: 0,
          total: 0,
        },
      });

      return order;
    });

    logger.info(`Order created: ${orderNumber} by ${userId}`);

    return {
      success: true,
      message: 'ઓર્ડર સફળતાપૂર્વક મૂકવામાં આવ્યો!',
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: Number(order.total),
        paymentMethod: order.paymentMethod,
        estimatedDelivery: '5-7 દિવસ',
      },
    };
  },

  /**
   * Get order details
   */
  async getOrderDetails(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      select: ORDER_SELECT,
    });

    if (!order) {
      throw new ApiError(404, 'ઓર્ડર મળ્યો નથી');
    }

    // Status timeline
    const timeline = [
      { status: 'PENDING', label: 'પેન્ડિંગ', labelEn: 'Pending', completed: !!order.createdAt },
      { status: 'CONFIRMED', label: 'પુષ્ટિ', labelEn: 'Confirmed', completed: !!order.confirmedAt },
      { status: 'PROCESSING', label: 'પ્રક્રિયા', labelEn: 'Processing', completed: !!order.processedAt },
      { status: 'SHIPPED', label: 'મોકલાયેલ', labelEn: 'Shipped', completed: !!order.shippedAt },
      { status: 'DELIVERED', label: 'પહોંચાડેલ', labelEn: 'Delivered', completed: !!order.deliveredAt },
    ];

    return {
      success: true,
      data: {
        ...order,
        timeline,
        subtotal: Number(order.subtotal),
        shipping: Number(order.shipping),
        tax: Number(order.tax),
        discount: Number(order.discount),
        couponDiscount: Number(order.couponDiscount),
        total: Number(order.total),
      },
    };
  },

  /**
   * Track order status
   */
  async trackOrder(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        trackingNumber: true,
        courierName: true,
        estimatedDelivery: true,
        createdAt: true,
        confirmedAt: true,
        processedAt: true,
        shippedAt: true,
        deliveredAt: true,
        cancelledAt: true,
        shippingAddress: true,
        items: {
          select: {
            productName: true,
            image: true,
            quantity: true,
          },
        },
      },
    });

    if (!order) {
      throw new ApiError(404, 'ઓર્ડર મળ્યો નથી');
    }

    // Status info
    const statusInfo: Record<string, any> = {
      PENDING: {
        title: 'પેન્ડિંગ',
        titleEn: 'Pending',
        message: 'તમારો ઓર્ડર પુષ્ટિ થઈ રહ્યો છે',
        messageEn: 'Order is being confirmed',
        icon: 'clock',
      },
      CONFIRMED: {
        title: 'પુષ્ટિ',
        titleEn: 'Confirmed',
        message: 'ઓર્ડર પુષ્ટિ થયો. જલ્દી જ મોકલવાશે',
        messageEn: 'Order confirmed. Will be shipped soon',
        icon: 'check',
      },
      PROCESSING: {
        title: 'પ્રક્રિયા',
        titleEn: 'Processing',
        message: 'પેકિંગ થઈ રહ્યું છે',
        messageEn: 'Being packed',
        icon: 'package',
      },
      SHIPPED: {
        title: 'મોકલાયેલ',
        titleEn: 'Shipped',
        message: order.trackingNumber
          ? `ટ્રેકિંગ: ${order.trackingNumber}`
          : 'શિપિંગ કંપની દ્વારા મોકલવામાં આવ્યું છે',
        messageEn: order.trackingNumber
          ? `Tracking: ${order.trackingNumber}`
          : 'Shipped via courier',
        icon: 'truck',
      },
      OUT_FOR_DELIVERY: {
        title: 'પહોંચાડવા માટે',
        titleEn: 'Out for Delivery',
        message: 'આજે તમારી દરવાજે પહોંચશે',
        messageEn: 'Will arrive today',
        icon: 'home',
      },
      DELIVERED: {
        title: 'પહોંચાડેલ',
        titleEn: 'Delivered',
        message: 'સફળતાપૂર્વક પહોંચાડવામાં આવ્યું',
        messageEn: 'Successfully delivered',
        icon: 'check-circle',
      },
      CANCELLED: {
        title: 'રદ કરેલ',
        titleEn: 'Cancelled',
        message: 'ઓર્ડર રદ કરવામાં આવ્યો',
        messageEn: 'Order cancelled',
        icon: 'x-circle',
      },
    };

    const info = statusInfo[order.status] || statusInfo.PENDING;

    return {
      success: true,
      data: {
        ...info,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        trackingNumber: order.trackingNumber,
        courierName: order.courierName,
        estimatedDelivery: order.estimatedDelivery,
        shippingAddress: order.shippingAddress,
        itemCount: order.items.length,
        createdAt: order.createdAt,
      },
    };
  },

  /**
   * Cancel order (user)
   */
  async cancelOrder(userId: string, orderId: string, reason?: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      select: {
        id: true,
        status: true,
        items: {
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    });

    if (!order) {
      throw new ApiError(404, 'ઓર્ડર મળ્યો નથી');
    }

    // Can only cancel pending orders
    if (order.status !== 'PENDING') {
      throw new ApiError(400, 'ફક્ત પેન્ડિંગ ઓર્ડર રદ કરી શકાય છે');
    }

    // Cancel order and restore inventory
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });

      // Restore inventory
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });

        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            type: 'RETURN',
            quantity: item.quantity,
            stockBefore: 0, // Will be calculated
            stockAfter: 0,
            referenceId: orderId,
            referenceType: 'ORDER_CANCEL',
            notes: reason || 'User cancelled',
          },
        });
      }
    });

    logger.info(`Order cancelled: ${orderId} by ${userId}`);

    return {
      success: true,
      message: 'ઓર્ડર રદ કરવામાં આવ્યો',
    };
  },

  /**
   * Get GST invoice
   */
  async getInvoice(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        items: {
          select: {
            productName: true,
            productNameGu: true,
            sku: true,
            quantity: true,
            unitPrice: true,
            tax: true,
            total: true,
          },
        },
        subtotal: true,
        shipping: true,
        tax: true,
        total: true,
        shippingAddress: true,
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw new ApiError(404, 'ઓર્ડર મળ્યો નથી');
    }

    // Generate invoice data
    const invoice = generateInvoice(order);

    return {
      success: true,
      data: invoice,
    };
  },

  // ============================================
  // ADMIN METHODS
  // ============================================

  /**
   * List all orders (admin)
   */
  async listAllOrders(query: any) {
    const { page = 1, limit = 20, status, search } = query;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { shippingAddress: { path: ['fullName'], contains: search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          items: {
            select: {
              productName: true,
              quantity: true,
            },
          },
          subtotal: true,
          total: true,
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          shippingAddress: true,
          createdAt: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      success: true,
      data: {
        orders: orders.map((o) => ({
          ...o,
          subtotal: Number(o.subtotal),
          total: Number(o.total),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  },

  /**
   * Update order status (admin)
   */
  async updateStatus(orderId: string, data: any, adminId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, confirmedAt: true },
    });

    if (!order) {
      throw new ApiError(404, 'ઓર્ડર મળ્યો નથી');
    }

    // Update timestamps based on status
    const updateData: any = {
      status: data.status,
    };

    if (data.status === 'CONFIRMED' && !order.confirmedAt) {
      updateData.confirmedAt = new Date();
    }
    if (data.status === 'PROCESSING') {
      updateData.processedAt = new Date();
    }
    if (data.status === 'SHIPPED' || data.status === 'OUT_FOR_DELIVERY') {
      updateData.shippedAt = new Date();
      updateData.trackingNumber = data.trackingNumber;
      updateData.courierName = data.courierName;
      updateData.estimatedDelivery = data.estimatedDelivery;
    }
    if (data.status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
      updateData.paymentStatus = 'PAID';
    }
    if (data.status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
    }

    if (data.adminNotes) {
      updateData.adminNotes = data.adminNotes;
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        trackingNumber: true,
        courierName: true,
        estimatedDelivery: true,
      },
    });

    logger.info(`Order status updated: ${orderId} -> ${data.status} by ${adminId}`);

    return {
      success: true,
      message: 'ઓર્ડર સ્થિતિ અપડેટ થઈ',
      data: updated,
    };
  },

  /**
   * Get order statistics (admin)
   */
  async getStats(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalOrders,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
    ] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: startDate } } }),
      prisma.order.count({ where: { status: 'PENDING', createdAt: { gte: startDate } } }),
      prisma.order.count({ where: { status: { in: ['SHIPPED', 'OUT_FOR_DELIVERY'] }, createdAt: { gte: startDate } } }),
      prisma.order.count({ where: { status: 'DELIVERED', createdAt: { gte: startDate } } }),
      prisma.order.count({ where: { status: 'CANCELLED', createdAt: { gte: startDate } } }),
      prisma.order.aggregate({
        where: { status: { not: 'CANCELLED' }, createdAt: { gte: startDate } },
        _sum: { total: true },
      }),
    ]);

    return {
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue: Number(totalRevenue._sum.total || 0),
        period: `Last ${days} days`,
      },
    };
  },
};
