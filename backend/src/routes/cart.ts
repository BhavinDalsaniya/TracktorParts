/**
 * Cart routes - Mobile optimized
 * Simple cart management with minimal friction
 */

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ApiError } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';
import { cartController } from '@/controllers/cart';
import { apiRateLimit } from '@/middleware/rateLimiter';

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().default(1),
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().positive('જથ્થો ધનાત્મક હોવો જોઈએ'),
});

const applyCouponSchema = z.object({
  code: z.string().min(1).toUpperCase(),
});

// ============================================
// PROTECTED ENDPOINTS
// ============================================

/**
 * @route   GET /api/cart
 * @desc    Get user's cart
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  apiRateLimit,
  asyncHandler(async (req, res) => {
    const result = await cartController.getCart(req.user!.id);
    res.json(result);
  })
);

/**
 * @route   POST /api/cart
 * @desc    Add item to cart
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = addToCartSchema.parse(req.body);
    const result = await cartController.addItem(req.user!.id, data);
    res.json(result);
  })
);

/**
 * @route   PATCH /api/cart/items/:id
 * @desc    Update cart item quantity
 * @access  Private
 */
router.patch(
  '/items/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = updateCartItemSchema.parse(req.body);
    const result = await cartController.updateItem(
      req.user!.id,
      req.params.id,
      data.quantity
    );
    res.json(result);
  })
);

/**
 * @route   DELETE /api/cart/items/:id
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete(
  '/items/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await cartController.removeItem(req.user!.id, req.params.id);
    res.json(result);
  })
);

/**
 * @route   DELETE /api/cart
 * @desc    Clear entire cart
 * @access  Private
 */
router.delete(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await cartController.clearCart(req.user!.id);
    res.json(result);
  })
);

/**
 * @route   POST /api/cart/coupon
 * @desc    Apply coupon code
 * @access  Private
 */
router.post(
  '/coupon',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = applyCouponSchema.parse(req.body);
    const result = await cartController.applyCoupon(req.user!.id, data.code);
    res.json(result);
  })
);

/**
 * @route   DELETE /api/cart/coupon
 * @desc    Remove coupon code
 * @access  Private
 */
router.delete(
  '/coupon',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await cartController.removeCoupon(req.user!.id);
    res.json(result);
  })
);

/**
 * @route   GET /api/cart/summary
 * @desc    Get cart summary for checkout
 * @access  Private
 */
router.get(
  '/summary',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await cartController.getSummary(req.user!.id);
    res.json(result);
  })
);

export default router;
