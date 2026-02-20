/**
 * Rate Limiting Middleware
 * OTP-specific rate limiting to prevent abuse
 */

import rateLimit from 'express-rate-limit';
import { logger } from '@/utils/logger';

/**
 * OTP Send Rate Limiter
 * Limit: 3 requests per hour per phone number
 */
export const otpRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 OTPs per hour
  message: {
    success: false,
    error: 'ખૂબ વધારે OTP વિનંતીઓ. કૃપા કરીને 1 કલાક પછી ફરી પ્રયત્ન કરો.', // Too many OTP requests. Please try again after 1 hour.
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use phone number as key
  keyGenerator: (req) => {
    return req.body?.phone || req.ip;
  },
  // Skip successful requests (only count failed ones)
  skipSuccessfulRequests: false,
  // Custom handler
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for OTP: ${req.body?.phone || req.ip}`);
    res.status(429).json({
      success: false,
      error: 'ખૂબ વધારે OTP વિનંતીઓ. કૃપા કરીને 1 કલાક પછી ફરી પ્રયત્ન કરો.',
      retryAfter: 3600, // seconds
    });
  },
});

/**
 * OTP Verify Rate Limiter
 * Limit: 10 requests per 5 minutes per phone number
 */
export const otpVerifyRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: {
    success: false,
    error: 'ખૂબ વધારે પ્રયત્નો. કૃપા કરીને થોડી વાર પછી ફરી પ્રયત્ન કરો.', // Too many attempts. Please try again later.
  },
  keyGenerator: (req) => {
    return req.body?.phone || req.ip;
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for OTP verify: ${req.body?.phone || req.ip}`);
    res.status(429).json({
      success: false,
      error: 'ખૂબ વધારે પ્રયત્નો. કૃપા કરીને થોડી વાર પછી ફરી પ્રયત્ન કરો.',
      retryAfter: 300, // seconds
    });
  },
});

/**
 * General API Rate Limiter
 * Limit: 100 requests per 15 minutes
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: 'ખૂબ વધારે વિનંતીઓ. કૃપા કરીને ફરી પ્રયત્ન કરો.', // Too many requests. Please try again.
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth Rate Limiter (for login/register)
 * Limit: 5 requests per hour per IP
 */
export const authRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    error: 'ખૂબ વધારે પ્રયત્નો. કૃપા કરીને 1 કલાક પછી ફરી પ્રયત્ન કરો.', // Too many attempts. Please try again after 1 hour.
  },
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for auth: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'ખૂબ વધારે પ્રયત્નો. કૃપા કરીને 1 કલાક પછી ફરી પ્રયત્ન કરો.',
      retryAfter: 3600,
    });
  },
});

export default {
  otpRateLimit,
  otpVerifyRateLimit,
  apiRateLimit,
  authRateLimit,
};
