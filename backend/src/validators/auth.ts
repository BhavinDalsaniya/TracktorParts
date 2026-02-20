/**
 * Auth validators using Zod
 * Simple, mobile-friendly validation
 */

import { z } from 'zod';

/**
 * Send OTP validation schema
 */
export const sendOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'કૃપા કરીને માન્ય મોબાઇલ નંબર દાખલ કરો'),
});

/**
 * Verify OTP validation schema
 */
export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'કૃપા કરીને માન્ય મોબાઇલ નંબર દાખલ કરો'),
  otp: z.string().length(6, 'OTP 6 અંકોનો હોવો જોઈએ'),
  name: z.string().min(2, 'નામ ઓછામાં ઓછા 2 અક્ષરોનું હોવું જોઈએ').optional(),
});

/**
 * Admin login validation schema (password-based)
 */
export const adminLoginSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'કૃપા કરીને માન્ય મોબાઇલ નંબર દાખલ કરો'),
  password: z.string().min(1, 'પાસવર્ડ દાખલ કરો'),
});

/**
 * Refresh token validation schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'રિફ્રેશ ટોકન દાખલ કરો'),
});

/**
 * Update profile validation schema
 */
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'નામ ઓછામાં ઓછા 2 અક્ષરોનું હોવું જોઈએ').optional(),
  email: z.string().email('માન્ય ઇમેઇલ દાખલ કરો').optional().or(z.literal('')),
  language: z.enum(['GUJARATI', 'ENGLISH', 'HINDI']).optional(),
});

/**
 * Change password validation schema (for admin)
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'વર્તમાન પાસવર્ડ દાખલ કરો'),
  newPassword: z.string().min(6, 'નવો પાસવર્ડ ઓછામાં ઓછા 6 અક્ષરોનો હોવો જોઈએ'),
});

/**
 * Register validation schema (legacy, for admin use)
 */
export const registerSchema = z.object({
  name: z.string().min(2, 'નામ ઓછામાં ઓછા 2 અક્ષરોનું હોવું જોઈએ'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'માન્ય ફોન નંબર દાખલ કરો'),
  email: z.string().email('માન્ય ઇમેઇલ દાખલ કરો').optional().or(z.literal('')),
  password: z.string().min(6, 'પાસવર્ડ ઓછામાં ઓછા 6 અક્ષરોનું હોવું જોઈએ'),
  language: z.enum(['GUJARATI', 'ENGLISH', 'HINDI']).default('GUJARATI'),
});

/**
 * Login validation schema (legacy, for admin use)
 */
export const loginSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'માન્ય ફોન નંબર દાખલ કરો'),
  password: z.string().min(1, 'પાસવર્ડ દાખલ કરો'),
});

// Type exports
export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
