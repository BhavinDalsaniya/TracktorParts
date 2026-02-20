/**
 * OTP Service
 * Simple in-memory OTP storage with Redis support option
 */

import { logger } from '@/utils/logger';
import crypto from 'crypto';

// In-memory storage (for development)
// In production, use Redis or database
interface OTPData {
  otp: string;
  attempts: number;
  expiresAt: Date;
}

const otpStore = new Map<string, OTPData>();

// Clean up expired OTPs every 5 minutes
setInterval(() => {
  const now = new Date();
  let cleaned = 0;

  for (const [phone, data] of otpStore.entries()) {
    if (data.expiresAt < now) {
      otpStore.delete(phone);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.debug(`Cleaned ${cleaned} expired OTPs`);
  }
}, 5 * 60 * 1000);

export const otpService = {
  /**
   * Generate a 6-digit OTP for the given phone number
   */
  async generate(phone: string): Promise<string> {
    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Store OTP with 5 minute expiry
    otpStore.set(phone, {
      otp,
      attempts: 0,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });

    logger.debug(`OTP generated for ${phone}, expires in 5 minutes`);

    return otp;
  },

  /**
   * Verify OTP for the given phone number
   */
  async verify(phone: string, providedOtp: string): Promise<boolean> {
    const data = otpStore.get(phone);

    if (!data) {
      logger.debug(`OTP verification failed: No OTP found for ${phone}`);
      return false;
    }

    // Check expiration
    if (data.expiresAt < new Date()) {
      otpStore.delete(phone);
      logger.debug(`OTP verification failed: OTP expired for ${phone}`);
      return false;
    }

    // Check attempts (max 3)
    if (data.attempts >= 3) {
      otpStore.delete(phone);
      logger.debug(`OTP verification failed: Max attempts exceeded for ${phone}`);
      return false;
    }

    // Increment attempts
    data.attempts++;

    // Verify OTP
    const isValid = data.otp === providedOtp;

    if (isValid) {
      logger.info(`OTP verified successfully for ${phone}`);
    } else {
      logger.debug(`OTP verification failed: Invalid OTP for ${phone} (attempt ${data.attempts}/3)`);
    }

    return isValid;
  },

  /**
   * Delete OTP for the given phone number
   */
  async delete(phone: string): Promise<void> {
    otpStore.delete(phone);
    logger.debug(`OTP deleted for ${phone}`);
  },

  /**
   * Check if OTP exists and is valid for the given phone number
   */
  async exists(phone: string): Promise<boolean> {
    const data = otpStore.get(phone);
    if (!data) return false;
    return data.expiresAt > new Date();
  },

  /**
   * Get remaining time in seconds
   */
  async getRemainingTime(phone: string): Promise<number> {
    const data = otpStore.get(phone);
    if (!data) return 0;

    const remaining = Math.floor((data.expiresAt.getTime() - Date.now()) / 1000);
    return Math.max(0, remaining);
  },

  /**
   * Get remaining attempts
   */
  async getRemainingAttempts(phone: string): Promise<number> {
    const data = otpStore.get(phone);
    if (!data) return 0;

    return Math.max(0, 3 - data.attempts);
  },
};

export default otpService;
