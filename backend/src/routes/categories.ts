/**
 * Category routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ApiError } from '@/middleware/errorHandler';
import { authenticate, requireRole } from '@/middleware/auth';
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
      slug: z.string().regex(/^[a-z0-9-]+$/),
      description: z.string().optional(),
      descriptionGu: z.string().optional(),
      image: z.string().optional(),
      icon: z.string().optional(),
      parentId: z.string().optional(),
      displayOrder: z.number().int().default(0),
      featured: z.boolean().default(false),
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
      data,
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
      slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
      description: z.string().optional(),
      descriptionGu: z.string().optional(),
      image: z.string().optional(),
      icon: z.string().optional(),
      parentId: z.string().optional(),
      displayOrder: z.number().int().optional(),
      featured: z.boolean().optional(),
      isActive: z.boolean().optional(),
    });

    const data = schema.parse(req.body);

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data,
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

export default router;
