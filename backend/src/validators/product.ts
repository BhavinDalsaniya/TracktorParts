/**
 * Product validators using Zod
 */

import { z } from 'zod';

/**
 * Create product validation schema (admin only)
 */
export const createProductSchema = z.object({
  name: z.string().min(1, 'પ્રોડક્ટનું નામ દાખલ કરો'), // Enter product name
  nameGu: z.string().min(1, 'પ્રોડક્ટનું ગુજરાતી નામ દાખલ કરો'), // Enter product name in Gujarati
  slug: z.string().regex(/^[a-z0-9-]+$/, 'અમાન્ય સ્લગ'), // Invalid slug
  description: z.string().min(1, 'વર્ણન દાખલ કરો'), // Enter description
  descriptionGu: z.string().min(1, 'ગુજરાતી વર્ણન દાખલ કરો'), // Enter description in Gujarati
  price: z.number().positive('કિંમત ધનાત્મક હોવી જોઈએ'), // Price must be positive
  compareAtPrice: z.number().positive().optional(),
  sku: z.string().min(1, 'SKU દાખલ કરો'), // Enter SKU
  stock: z.number().int().min(0, 'સ્ટોક શૂન્ય કરતાં વધુ હોવો જોઈએ'), // Stock must be >= 0
  images: z.array(z.string().url()).min(1, 'ઓછામાં ઓછી એક છબી દાખલ કરો'), // Enter at least one image
  categoryId: z.string().min(1, 'શ્રેણી પસંદ કરો'), // Select category
  compatibility: z.array(z.string()).default([]),
  weight: z.number().positive().optional(),
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  isActive: z.boolean().default(true),
});

/**
 * Update product validation schema (admin only)
 */
export const updateProductSchema = createProductSchema.partial();

/**
 * Get products query schema
 */
export const getProductsQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 12)),
  categoryId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'price', 'createdAt', 'stock']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  minPrice: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  maxPrice: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type GetProductsQuery = z.infer<typeof getProductsQuerySchema>;
