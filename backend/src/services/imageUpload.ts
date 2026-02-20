/**
 * Image Upload Service with Compression
 * Optimized for mobile - converts to WebP, compresses
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { logger } from '@/utils/logger';

// Configure multer for memory storage (before compression)
const storage = multer.memoryStorage();

export const multerUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
    files: 5, // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    // Allow only images
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('માત્ર છબીઓ અપલોડ કરો (JPEG, PNG, GIF, WebP)'));
    }
  },
});

/**
 * Compress image to WebP format
 * - Max width: 800px
 * - Quality: 75%
 * - Format: WebP (smaller size, good quality)
 */
async function compressImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(800, 800, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 75, effort: 6 })
    .toBuffer();
}

/**
 * Generate thumbnail
 * - Max width: 300px
 * - Quality: 70%
 */
async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(300, 300, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: 70, effort: 4 })
    .toBuffer();
}

/**
 * Store image file
 * In production, use S3/CloudFront/CDN
 */
async function storeImage(
  buffer: Buffer,
  filename: string,
  productId: string
): Promise<string> {
  // Create uploads directory if not exists
  const uploadDir = path.join(process.cwd(), 'uploads', 'products', productId);
  await fs.mkdir(uploadDir, { recursive: true });

  const filepath = path.join(uploadDir, filename);
  await fs.writeFile(filepath, buffer);

  // Return URL (in production, return CDN URL)
  return `/uploads/products/${productId}/${filename}`;
}

/**
 * Compress and store multiple images
 */
export async function compressAndStoreImages(
  files: Express.Multer.File[],
  productId: string
): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      // Compress image
      const compressed = await compressImage(file.buffer);

      // Generate filename
      const filename = `img_${Date.now()}_${i}.webp`;

      // Store image
      const url = await storeImage(compressed, filename, productId);
      urls.push(url);

      logger.info(`Image compressed: ${file.originalname} -> ${filename}`);
    } catch (error) {
      logger.error(`Image compression failed: ${file.originalname}`, error);
    }
  }

  return urls;
}

/**
 * Delete image from storage
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Extract filepath from URL
    // For production, delete from S3/CDN
    const filepath = path.join(process.cwd(), imageUrl);
    await fs.unlink(filepath);
    logger.info(`Image deleted: ${imageUrl}`);
  } catch (error) {
    logger.error(`Image deletion failed: ${imageUrl}`, error);
  }
}

/**
 * Get image info
 */
export async function getImageInfo(imageUrl: string) {
  try {
    const filepath = path.join(process.cwd(), imageUrl);
    const stats = await fs.stat(filepath);
    const metadata = await sharp(filepath).metadata();

    return {
      size: stats.size,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
    };
  } catch (error) {
    return null;
  }
}

export default {
  multerUpload,
  compressAndStoreImages,
  deleteImage,
  getImageInfo,
};
