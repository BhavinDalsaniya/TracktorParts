/**
 * Category routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ApiError } from '@/middleware/errorHandler';
import { authenticate, requireRole } from '@/middleware/auth';
import { multerUpload } from '@/services/imageUpload';
import { prisma } from '@/config/database';
import { apiRateLimit } from '@/middleware/rateLimiter';

const router = Router();

// ============================================
// PUBLIC ENDPOINTS
// ============================================

/**
 * @route   GET /api/categories
 * @desc    List all categories
 * @access  Public
 */
router.get(
  '/',
  apiRateLimit,
  asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        nameGu: true,
        slug: true,
        description: true,
        descriptionGu: true,
        image: true,
        icon: true,
        parentId: true,
        displayOrder: true,
        featured: true,
      },
      orderBy: { displayOrder: 'asc' },
    });

    res.json({
      success: true,
      data: categories,
    });
  })
);

/**
 * @route   GET /api/categories/:slug
 * @desc    Get category by slug
 * @access  Public
 */
router.get(
  '/:slug',
  apiRateLimit,
  asyncHandler(async (req, res) => {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug, isActive: true },
      include: {
        children: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            nameGu: true,
            slug: true,
            displayOrder: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!category) {
      throw new ApiError(404, 'શ્રેણી મળ્યું નથી');
    }

    res.json({
      success: true,
      data: category,
    });
  })
);

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * @route   POST /api/categories
 * @desc    Create new category (Admin only)
 * @access  Admin
 */
router.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      name: z.string().min(1),
      nameGu: z.string().min(1),
      slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
      description: z.string().optional(),
      descriptionGu: z.string().optional(),
      image: z.string().nullable().optional(),
      icon: z.string().optional(),
      parentId: z.string().optional(),
      displayOrder: z.coerce.number().int().default(0),
      featured: z.coerce.boolean().default(false),
      isActive: z.coerce.boolean().default(true),
    });

    const data = schema.parse(req.body);

    // Check if slug exists
    const existing = await prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ApiError(400, 'Slug પહેલેથી અસ્તિત્વમાં છે');
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        nameGu: data.nameGu,
        slug: data.slug,
        description: data.description || null,
        descriptionGu: data.descriptionGu || null,
        image: data.image || null,
        displayOrder: data.displayOrder,
        featured: data.featured,
        isActive: data.isActive,
      },
    });

    res.status(201).json({
      success: true,
      message: 'શ્રેણી બનાવવામાં આવી',
      data: category,
    });
  })
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category (Admin only)
 * @access  Admin
 */
router.put(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      name: z.string().min(1).optional(),
      nameGu: z.string().min(1).optional(),
      slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
      description: z.string().optional(),
      descriptionGu: z.string().optional(),
      image: z.string().nullable().optional(),
      icon: z.string().optional(),
      parentId: z.string().optional(),
      displayOrder: z.coerce.number().int().optional(),
      featured: z.coerce.boolean().optional(),
      isActive: z.coerce.boolean().optional(),
    });

    const data = schema.parse(req.body);

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.nameGu !== undefined && { nameGu: data.nameGu }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.descriptionGu !== undefined && { descriptionGu: data.descriptionGu || null }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
        ...(data.featured !== undefined && { featured: data.featured }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    res.json({
      success: true,
      message: 'શ્રેણી અપડેટ થઈ',
      data: category,
    });
  })
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category (Admin only)
 * @access  Admin
 */
router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    await prisma.category.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'શ્રેણી કાઢી નાખવામાં આવી',
    });
  })
);

/**
 * @route   POST /api/categories/upload-image
 * @desc    Upload category image (Admin only)
 * @access  Admin
 */
router.post(
  '/upload-image',
  authenticate,
  requireRole('ADMIN'),
  multerUpload.single('image'),
  asyncHandler(async (req, res) => {
    const file = req.file as Express.Multer.File;
    if (!file) {
      throw new ApiError(400, 'છબી જરૂરી છે');
    }

    const { compressAndStoreImages } = await import('@/services/imageUpload');
    const urls = await compressAndStoreImages([file], 'temp', 'categories');

    res.json({
      success: true,
      data: {
        image: urls[0],
      },
    });
  })
);

/**
 * @route   GET /api/categories/admin/all
 * @desc    Get all categories including inactive (Admin only)
 * @access  Admin
 */
router.get(
  '/admin/all',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        nameGu: true,
        slug: true,
        description: true,
        descriptionGu: true,
        image: true,
        icon: true,
        parentId: true,
        displayOrder: true,
        featured: true,
        isActive: true,
        parent: {
          select: {
            id: true,
            name: true,
            nameGu: true,
          },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    res.json({
      success: true,
      data: categories,
    });
  })
);

export default router;
