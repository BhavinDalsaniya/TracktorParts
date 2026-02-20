/**
 * Product Controller - Mobile optimized
 * Lightweight responses, efficient queries
 */

import { prisma } from '@/config/database';
import { ApiError } from '@/middleware/errorHandler';
import { compressAndStoreImages, deleteImage } from '@/services/imageUpload';
import { logger } from '@/utils/logger';
import { Prisma } from '@prisma/client';

// Mobile-friendly product list item (minimal fields)
const MOBILE_PRODUCT_SELECT = {
  id: true,
  name: true,
  nameGu: true,
  slug: true,
  price: true,
  compareAtPrice: true,
  thumbnail: true,
  images: true,  // Added to show images in product list
  stock: true,
  averageRating: true,
  reviewCount: true,
  isFeatured: true,
  isNew: true,
} as const;

// Full product details
const FULL_PRODUCT_SELECT = {
  id: true,
  sku: true,
  name: true,
  nameGu: true,
  slug: true,
  shortDescription: true,
  shortDescriptionGu: true,
  description: true,
  descriptionGu: true,
  price: true,
  compareAtPrice: true,
  stock: true,
  images: true,
  thumbnail: true,
  categoryId: true,
  category: {
    select: {
      id: true,
      name: true,
      nameGu: true,
      slug: true,
    },
  },
  tags: true,
  specifications: true,
  specificationsGu: true,
  weight: true,
  length: true,
  width: true,
  height: true,
  isReturnable: true,
  warrantyDays: true,
  averageRating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
  compatibility: {
    select: {
      id: true,
      notes: true,
      notesGu: true,
      isConfirmed: true,
      model: {
        select: {
          id: true,
          name: true,
          nameGu: true,
          slug: true,
          brand: {
            select: {
              id: true,
              name: true,
              nameGu: true,
              slug: true,
            },
          },
        },
      },
    },
  },
} as const;

export const productController = {
  /**
   * List products with pagination & filters
   * Optimized for mobile with minimal response size
   */
  async list(query: any) {
    const {
      page = 1,
      limit = 12,
      categoryId,
      search,
      tractorModelId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minPrice,
      maxPrice,
      inStock,
      isFeatured,
    } = query;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameGu: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    if (tractorModelId) {
      where.compatibility = {
        some: { modelId: tractorModelId },
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (inStock) {
      where.stock = { gt: 0 };
    }

    if (isFeatured) {
      where.isFeatured = true;
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Execute queries in parallel
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: MOBILE_PRODUCT_SELECT,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
    };
  },

  /**
   * Search products (Gujarati + English support)
   * Uses PostgreSQL full-text search
   */
  async search(query: string, pagination: any) {
    const { page = 1, limit = 12 } = pagination;

    // Use Prisma raw query for better full-text search
    const searchTerm = query.replace(/'/g, "''");

    const [products, total] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT
          id, name, name_gu as "nameGu", slug, price,
          "compareAtPrice", thumbnail, stock,
          "averageRating", "reviewCount"
        FROM products
        WHERE is_active = true
          AND (
            name ILIKE ${`%${searchTerm}%`}
            OR name_gu ILIKE ${`%${searchTerm}%`}
            OR tags @> ARRAY[${searchTerm}]::VARCHAR[]
          )
        ORDER BY
          CASE
            WHEN name ILIKE ${`${searchTerm}%`} THEN 1
            WHEN name_gu ILIKE ${`${searchTerm}%`} THEN 2
            ELSE 3
          END,
          sold_count DESC
        LIMIT ${limit}
        OFFSET ${(page - 1) * limit}
      `,
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM products
        WHERE is_active = true
          AND (
            name ILIKE ${`%${searchTerm}%`}
            OR name_gu ILIKE ${`%${searchTerm}%`}
            OR tags @> ARRAY[${searchTerm}]::VARCHAR[]
          )
      `.then(r => Number(r[0].count)),
    ]);

    return {
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
        query,
      },
    };
  },

  /**
   * Get featured products (for mobile home)
   */
  async featured(limit: number) {
    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      select: MOBILE_PRODUCT_SELECT,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: products,
    };
  },

  /**
   * Get products by tractor model compatibility
   */
  async byTractorModel(modelSlug: string, pagination: any) {
    const { page = 1, limit = 12 } = pagination;

    // First find the model
    const model = await prisma.tractorModel.findUnique({
      where: { slug: modelSlug },
      select: { id: true },
    });

    if (!model) {
      throw new ApiError(404, 'ટ્રેક્ટર મોડેલ મળ્યું નથી');
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          compatibility: { some: { modelId: model.id } },
        },
        select: MOBILE_PRODUCT_SELECT,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { soldCount: 'desc' },
      }),
      prisma.product.count({
        where: {
          isActive: true,
          compatibility: { some: { modelId: model.id } },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        products,
        model: { slug: modelSlug },
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
   * Get product by slug (full details)
   */
  async getBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      select: FULL_PRODUCT_SELECT,
    });

    if (!product) {
      throw new ApiError(404, 'પ્રોડક્ટ મળ્યું નથી');
    }

    // Increment view count asynchronously (don't wait)
    prisma.product
      .update({
        where: { id: product.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {});

    return {
      success: true,
      data: product,
    };
  },

  /**
   * Get product by ID (for admin)
   */
  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      select: FULL_PRODUCT_SELECT,
    });

    if (!product) {
      throw new ApiError(404, 'પ્રોડક્ટ મળ્યું નથી');
    }

    return {
      success: true,
      data: product,
    };
  },

  /**
   * Get related products
   */
  async related(productId: string, limit: number) {
    // Get product's category first
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true, id: true },
    });

    if (!product) {
      throw new ApiError(404, 'પ્રોડક્ટ મળ્યું નથી');
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        categoryId: product.categoryId,
        id: { not: product.id },
        stock: { gt: 0 },
      },
      select: MOBILE_PRODUCT_SELECT,
      take: limit,
      orderBy: { soldCount: 'desc' },
    });

    return {
      success: true,
      data: products,
    };
  },

  /**
   * Create new product (Admin)
   */
  async create(data: any, userId: string) {
    // Check if SKU exists
    const existing = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existing) {
      throw new ApiError(400, 'SKU પહેલેથી અસ્તિત્વમાં છે');
    }

    // Check if slug exists
    const existingSlug = await prisma.product.findUnique({
      where: { slug: data.slug },
    });

    if (existingSlug) {
      throw new ApiError(400, 'Slug પહેલેથી અસ્તિત્વમાં છે');
    }

    // Set thumbnail from first image
    const thumbnail = data.images?.[0] || null;

    const product = await prisma.product.create({
      data: {
        ...data,
        thumbnail,
        publishedAt: data.isActive ? new Date() : null,
      },
      select: FULL_PRODUCT_SELECT,
    });

    // Log inventory
    await prisma.inventoryLog.create({
      data: {
        productId: product.id,
        type: 'PURCHASE',
        quantity: data.stock || 0,
        stockBefore: 0,
        stockAfter: data.stock || 0,
        referenceType: 'PRODUCT_CREATE',
        performedBy: userId,
        performedByName: 'Admin',
      },
    });

    logger.info(`Product created: ${product.sku} by ${userId}`);

    return {
      success: true,
      message: 'પ્રોડક્ટ બનાવવામાં આવ્યું',
      data: product,
    };
  },

  /**
   * Update product (Admin)
   */
  async update(productId: string, data: any, userId: string) {
    const existing = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existing) {
      throw new ApiError(404, 'પ્રોડક્ટ મળ્યું નથી');
    }

    // Check SKU uniqueness if changed
    if (data.sku && data.sku !== existing.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku: data.sku },
      });
      if (skuExists) {
        throw new ApiError(400, 'SKU પહેલેથી અસ્તિત્વમાં છે');
      }
    }

    // Update thumbnail if images changed
    let thumbnail = existing.thumbnail;
    if (data.images && data.images.length > 0) {
      thumbnail = data.images[0];
    }

    // Handle first publish
    if (data.isActive && !existing.publishedAt) {
      data.publishedAt = new Date();
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: { ...data, thumbnail },
      select: FULL_PRODUCT_SELECT,
    });

    logger.info(`Product updated: ${product.sku} by ${userId}`);

    return {
      success: true,
      message: 'પ્રોડક્ટ અપડેટ થયું',
      data: product,
    };
  },

  /**
   * Update product inventory (Admin)
   */
  async updateStock(productId: string, data: any, userId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, sku: true, stock: true },
    });

    if (!product) {
      throw new ApiError(404, 'પ્રોડક્ટ મળ્યું નથી');
    }

    const stockBefore = product.stock;
    let stockAfter = stockBefore;
    let quantity = 0;
    let type = 'ADJUSTMENT';

    switch (data.type) {
      case 'ADD':
        stockAfter = stockBefore + data.stock;
        quantity = data.stock;
        type = 'PURCHASE';
        break;
      case 'REMOVE':
        stockAfter = Math.max(0, stockBefore - data.stock);
        quantity = -data.stock;
        type = 'SALE';
        break;
      case 'SET':
      default:
        stockAfter = data.stock;
        quantity = stockAfter - stockBefore;
        type = 'ADJUSTMENT';
        break;
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { stock: stockAfter },
      select: { id: true, sku: true, stock: true },
    });

    // Log inventory change
    await prisma.inventoryLog.create({
      data: {
        productId,
        type: type as any,
        quantity,
        stockBefore,
        stockAfter,
        notes: data.notes,
        performedBy: userId,
      },
    });

    logger.info(`Stock updated: ${product.sku} ${stockBefore} -> ${stockAfter}`);

    return {
      success: true,
      message: 'સ્ટોક અપડેટ થયું',
      data: updated,
    };
  },

  /**
   * Toggle product active status (Admin)
   */
  async toggleStatus(productId: string, isActive: boolean, userId: string) {
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        isActive,
        publishedAt: isActive ? new Date() : null,
      },
      select: { id: true, sku: true, isActive: true },
    });

    logger.info(`Product ${isActive ? 'activated' : 'deactivated'}: ${product.sku}`);

    return {
      success: true,
      message: isActive ? 'પ્રોડક્ટ સક્રિય થયું' : 'પ્રોડક્ટ નિષ્ક્રિય થયું',
      data: product,
    };
  },

  /**
   * Delete product (soft delete) (Admin)
   */
  async delete(productId: string, userId: string) {
    const product = await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
      select: { id: true, sku: true },
    });

    logger.info(`Product deleted (soft): ${product.sku} by ${userId}`);

    return {
      success: true,
      message: 'પ્રોડક્ટ કાઢી નાખવામાં આવ્યું',
    };
  },

  /**
   * Upload product images with compression (Admin)
   */
  async uploadImages(productId: string, files: Express.Multer.File[], userId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, images: true },
    });

    if (!product) {
      throw new ApiError(404, 'પ્રોડક્ટ મળ્યું નથી');
    }

    // Compress and store images
    const compressedUrls = await compressAndStoreImages(files, productId);

    // Add new images to existing
    const updatedImages = [...product.images, ...compressedUrls];

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        images: updatedImages,
        thumbnail: updatedImages[0], // First image as thumbnail
      },
      select: { id: true, images: true, thumbnail: true },
    });

    logger.info(`Images uploaded for product ${productId}: ${compressedUrls.length} files`);

    return {
      success: true,
      message: 'છબીઓ અપલોડ થઈ ગઈ',
      data: {
        images: updated.images,
        thumbnail: updated.thumbnail,
        addedCount: compressedUrls.length,
      },
    };
  },

  /**
   * Delete product image (Admin)
   */
  async deleteImage(productId: string, imageId: string, userId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, images: true },
    });

    if (!product) {
      throw new ApiError(404, 'પ્રોડક્ટ મળ્યું નથી');
    }

    const imageIndex = parseInt(imageId);
    if (imageIndex < 0 || imageIndex >= product.images.length) {
      throw new ApiError(400, 'અમાન્ય છબી');
    }

    // Delete image from storage
    await deleteImage(product.images[imageIndex]);

    // Remove from array
    const updatedImages = product.images.filter((_, i) => i !== imageIndex);

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        images: updatedImages,
        thumbnail: updatedImages[0] || null,
      },
      select: { id: true, images: true, thumbnail: true },
    });

    return {
      success: true,
      message: 'છબી કાઢી નાખવામાં આવી',
      data: {
        images: updated.images,
        thumbnail: updated.thumbnail,
      },
    };
  },
};
