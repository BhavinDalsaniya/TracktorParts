/**
 * Product routes - Mobile optimized
 * Lightweight responses, efficient queries
 */

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ApiError } from '@/middleware/errorHandler';
import { authenticate, requireRole, optionalAuth } from '@/middleware/auth';
import { multerUpload } from '@/services/imageUpload';
import { productController } from '@/controllers/product';
import { apiRateLimit } from '@/middleware/rateLimiter';

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createProductSchema = z.object({
  name: z.string().min(1),
  nameGu: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  shortDescription: z.string().optional(),
  shortDescriptionGu: z.string().optional(),
  description: z.string().min(1),
  descriptionGu: z.string().min(1),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  sku: z.string().min(1),
  stock: z.number().int().min(0).default(0),
  categoryId: z.string().min(1),
  tags: z.array(z.string()).default([]),
  specifications: z.record(z.any()).optional(),
  specificationsGu: z.record(z.any()).optional(),
  weight: z.number().positive().optional(),
  images: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

const updateProductSchema = createProductSchema.partial();

const listProductsSchema = z.object({
  page: z.string().optional().transform((v) => parseInt(v || '1') || 1),
  limit: z.string().optional().transform((v) => Math.min(parseInt(v || '1000') || 1000, 10000)), // Max 10000 for homepage
  categoryId: z.string().optional(),
  search: z.string().optional(),
  tractorModelId: z.string().optional(),
  sortBy: z.enum(['name', 'price', 'createdAt', 'stock', 'soldCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  minPrice: z.string().optional().transform((v) => v ? parseFloat(v) : undefined),
  maxPrice: z.string().optional().transform((v) => v ? parseFloat(v) : undefined),
  inStock: z.string().optional().transform((v) => v === 'true'),
  isFeatured: z.string().optional().transform((v) => v === 'true'),
});

const updateInventorySchema = z.object({
  stock: z.number().int().min(0),
  type: z.enum(['ADD', 'REMOVE', 'SET']).default('SET'),
  notes: z.string().optional(),
});

// ============================================
// PUBLIC ENDPOINTS
// ============================================

/**
 * @route   GET /api/products
 * @desc    List products with pagination & filters (Mobile optimized)
 * @access  Public
 * @rateLimit: 100 req/15min
 */
router.get(
  '/',
  apiRateLimit,
  asyncHandler(async (req, res) => {
    const query = listProductsSchema.parse(req.query);
    const result = await productController.list(query);
    res.json(result);
  })
);

/**
 * @route   GET /api/products/search
 * @desc    Search products (Gujarati + English)
 * @access  Public
 */
router.get(
  '/search',
  apiRateLimit,
  asyncHandler(async (req, res) => {
    const schema = z.object({
      q: z.string().min(2),
      page: z.string().transform((v) => parseInt(v) || 1),
      limit: z.string().transform((v) => Math.min(parseInt(v) || 12, 50)),
    });
    const { q, ...pagination } = schema.parse(req.query);
    const result = await productController.search(q, pagination);
    res.json(result);
  })
);

/**
 * @route   GET /api/products/featured
 * @desc    Get featured products (Mobile home page)
 * @access  Public
 */
router.get(
  '/featured',
  apiRateLimit,
  asyncHandler(async (req, res) => {
    const schema = z.object({
      limit: z.string().transform((v) => Math.min(parseInt(v) || 10, 20)),
    });
    const { limit } = schema.parse(req.query);
    const result = await productController.featured(limit);
    res.json(result);
  })
);

/**
 * @route   GET /api/products/compatible/:modelSlug
 * @desc    Get products compatible with tractor model
 * @access  Public
 */
router.get(
  '/compatible/:modelSlug',
  apiRateLimit,
  asyncHandler(async (req, res) => {
    const schema = z.object({
      page: z.string().transform((v) => parseInt(v) || 1),
      limit: z.string().transform((v) => Math.min(parseInt(v) || 12, 50)),
    });
    const pagination = schema.parse(req.query);
    const result = await productController.byTractorModel(
      req.params.modelSlug,
      pagination
    );
    res.json(result);
  })
);

/**
 * @route   GET /api/products/id/:id
 * @desc    Get product details by ID (for admin)
 * @access  Public
 */
router.get(
  '/id/:id',
  apiRateLimit,
  asyncHandler(async (req, res) => {
    const result = await productController.getById(req.params.id);
    res.json(result);
  })
);

/**
 * @route   GET /api/products/:slug
 * @desc    Get product details by slug
 * @access  Public
 */
router.get(
  '/:slug',
  apiRateLimit,
  asyncHandler(async (req, res) => {
    const result = await productController.getBySlug(req.params.slug);
    res.json(result);
  })
);

/**
 * @route   GET /api/products/:id/related
 * @desc    Get related products
 * @access  Public
 */
router.get(
  '/:id/related',
  apiRateLimit,
  asyncHandler(async (req, res) => {
    const schema = z.object({
      limit: z.string().transform((v) => Math.min(parseInt(v) || 6, 12)),
    });
    const { limit } = schema.parse(req.query);
    const result = await productController.related(req.params.id, limit);
    res.json(result);
  })
);

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * @route   POST /api/products/upload-images
 * @desc    Upload temporary images before creating product (Admin only)
 * @access  Admin
 * @uploads: Max 5 images, auto-compressed to WebP
 */
router.post(
  '/upload-images',
  authenticate,
  requireRole('ADMIN'),
  multerUpload.array('images', 5),
  asyncHandler(async (req, res) => {
    const files = req.files as Express.Multer.File[];
    const { compressAndStoreImages } = await import('@/services/imageUpload');

    // Use a temporary product ID (timestamp)
    const tempProductId = `temp_${Date.now()}`;
    const urls = await compressAndStoreImages(files, tempProductId);

    res.json({
      success: true,
      data: {
        images: urls,
        tempId: tempProductId,
      },
    });
  })
);

/**
 * @route   POST /api/products
 * @desc    Create new product (Admin only)
 * @access  Admin
 */
router.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const data = createProductSchema.parse(req.body);
    const result = await productController.create(data, req.user!.id);
    res.status(201).json(result);
  })
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product (Admin only)
 * @access  Admin
 */
router.put(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const data = updateProductSchema.parse(req.body);
    const result = await productController.update(req.params.id, data, req.user!.id);
    res.json(result);
  })
);

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    Update product inventory (Admin only)
 * @access  Admin
 */
router.patch(
  '/:id/stock',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const data = updateInventorySchema.parse(req.body);
    const result = await productController.updateStock(
      req.params.id,
      data,
      req.user!.id
    );
    res.json(result);
  })
);

/**
 * @route   PATCH /api/products/:id/status
 * @desc    Toggle product active status (Admin only)
 * @access  Admin
 */
router.patch(
  '/:id/status',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      isActive: z.boolean(),
    });
    const { isActive } = schema.parse(req.body);
    const result = await productController.toggleStatus(
      req.params.id,
      isActive,
      req.user!.id
    );
    res.json(result);
  })
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product (soft delete) (Admin only)
 * @access  Admin
 */
router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const result = await productController.delete(req.params.id, req.user!.id);
    res.json(result);
  })
);

/**
 * @route   POST /api/products/:id/images
 * @desc    Upload product images with compression (Admin only)
 * @access  Admin
 * @uploads: Max 5 images, auto-compressed to WebP
 */
router.post(
  '/:id/images',
  authenticate,
  requireRole('ADMIN'),
  multerUpload.array('images', 5),
  asyncHandler(async (req, res) => {
    const files = req.files as Express.Multer.File[];
    const result = await productController.uploadImages(
      req.params.id,
      files,
      req.user!.id
    );
    res.json(result);
  })
);

/**
 * @route   DELETE /api/products/:id/images/:imageId
 * @desc    Delete product image (Admin only)
 * @access  Admin
 */
router.delete(
  '/:id/images/:imageId',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const result = await productController.deleteImage(
      req.params.id,
      req.params.imageId,
      req.user!.id
    );
    res.json(result);
  })
);

export default router;
