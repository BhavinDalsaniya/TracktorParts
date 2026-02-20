/**
 * Order validators using Zod
 */

import { z } from 'zod';

/**
 * Create order validation schema
 */
export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
  })).min(1, 'ઓછામાં ઓછી એક વસ્તુ હોવી જોઈએ'), // At least one item required
  addressId: z.string().min(1, 'સરનામું પસંદ કરો'), // Select address
  paymentMethod: z.enum(['COD', 'ONLINE', 'UPI'], {
    errorMap: () => ({ message: 'માન્ય ચુકવણી પદ્ધતિ પસંદ કરો' }), // Select valid payment method
  }),
  notes: z.string().optional(),
});

/**
 * Update order status validation schema (admin only)
 */
export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'], {
    errorMap: () => ({ message: 'માન્ય સ્થિતિ પસંદ કરો' }), // Select valid status
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
