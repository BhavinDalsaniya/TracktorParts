/**
 * Cart validators using Zod
 */

import { z } from 'zod';

/**
 * Add to cart validation schema
 */
export const addToCartSchema = z.object({
  productId: z.string().min(1, 'પ્રોડક્ટ ID દાખલ કરો'), // Enter product ID
  quantity: z.number().int().positive().default(1),
});

/**
 * Update cart item validation schema
 */
export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive('જથ્થો ધનાત્મક હોવો જોઈએ'), // Quantity must be positive
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
