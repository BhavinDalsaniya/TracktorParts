/**
 * Order routes - Mobile optimized checkout
 * Simple checkout flow with COD
 */

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ApiError } from '@/middleware/errorHandler';
import { authenticate, requireRole } from '@/middleware/auth';
import { orderController } from '@/controllers/order';
import { apiRateLimit } from '@/middleware/rateLimiter';

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createOrderSchema = z.object({
  addressId: z.string().min(1, 'સરનામું પસંદ કરો'),
  paymentMethod: z.enum(['COD', 'ONLINE', 'UPI'], {
    errorMap: () => ({ message: 'ચુકવણી પદ્ધતિ પસંદ કરો' }),
  }),
  notes: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'], {
    errorMap: () => ({ message: 'માન્ય સ્થિતિ પસંદ કરો' }),
  }),
  trackingNumber: z.string().optional(),
  courierName: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  adminNotes: z.string().optional(),
});

const listOrdersSchema = z.object({
  page: z.string().transform((v) => parseInt(v) || 1),
  limit: z.string().transform((v) => Math.min(parseInt(v) || 10, 50)),
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
});

// ============================================
// USER ENDPOINTS
// ============================================

/**
 * @route   GET /api/orders
 * @desc    Get user's orders with pagination
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  apiRateLimit,
  asyncHandler(async (req, res) => {
    const query = listOrdersSchema.parse(req.query);
    const result = await orderController.listUserOrders(req.user!.id, query);
    res.json(result);
  })
);

/**
 * @route   GET /api/orders/summary
 * @desc    Get checkout summary from cart
 * @access  Private
 */
router.get(
  '/summary',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await orderController.getCheckoutSummary(req.user!.id);
    res.json(result);
  })
);

/**
 * @route   POST /api/orders
 * @desc    Create order from cart (Simple checkout)
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = createOrderSchema.parse(req.body);
    const result = await orderController.createOrder(req.user!.id, data);
    res.json(result);
  })
);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order details with status tracking
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await orderController.getOrderDetails(
      req.user!.id,
      req.params.id
    );
    res.json(result);
  })
);

/**
 * @route   GET /api/orders/:id/track
 * @desc    Get order tracking status
 * @access  Private
 */
router.get(
  '/:id/track',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await orderController.trackOrder(req.user!.id, req.params.id);
    res.json(result);
  })
);

/**
 * @route   POST /api/orders/:id/cancel
 * @desc    Cancel order (user only)
 * @access  Private
 */
router.post(
  '/:id/cancel',
  authenticate,
  asyncHandler(async (req, res) => {
    const schema = z.object({
      reason: z.string().optional(),
    });
    const { reason } = schema.parse(req.body);
    const result = await orderController.cancelOrder(
      req.user!.id,
      req.params.id,
      reason
    );
    res.json(result);
  })
);

/**
 * @route   GET /api/orders/:id/invoice
 * @desc    Get GST invoice PDF
 * @access  Private
 */
router.get(
  '/:id/invoice',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await orderController.getInvoice(req.user!.id, req.params.id);
    res.json(result);
  })
);

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * @route   GET /api/orders/admin/all
 * @desc    Get all orders (admin only)
 * @access  Admin
 */
router.get(
  '/admin/all',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      page: z.string().transform((v) => parseInt(v) || 1),
      limit: z.string().transform((v) => Math.min(parseInt(v) || 20, 100)),
      status: z.string().optional(),
      search: z.string().optional(),
    });
    const query = schema.parse(req.query);
    const result = await orderController.listAllOrders(query);
    res.json(result);
  })
);

/**
 * @route   PATCH /api/orders/admin/:id/status
 * @desc    Update order status (admin only)
 * @access  Admin
 */
router.patch(
  '/admin/:id/status',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const data = updateStatusSchema.parse(req.body);
    const result = await orderController.updateStatus(
      req.params.id,
      data,
      req.user!.id
    );
    res.json(result);
  })
);

/**
 * @route   GET /api/orders/admin/stats
 * @desc    Get order statistics (admin only)
 * @access  Admin
 */
router.get(
  '/admin/stats',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      days: z.string().transform((v) => parseInt(v) || 30).optional(),
    });
    const { days } = schema.parse(req.query);
    const result = await orderController.getStats(days);
    res.json(result);
  })
);

export default router;
