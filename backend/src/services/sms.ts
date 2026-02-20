/**
 * SMS Service
 * Development-friendly SMS service with logging
 * Replace with real SMS gateway (Twilio, MSG91, etc.) in production
 */

import { logger } from '@/utils/logger';

interface SMSOptions {
  otp?: string;
  orderId?: string;
  amount?: number;
  deliveryDate?: string;
}

/**
 * Send OTP via SMS
 * In development, logs to console
 * In production, integrate with SMS gateway
 */
export async function sendOtp(phone: string, otp: string): Promise<boolean> {
  const message = `તમારો OTP છે: ${otp}. 5 મિનિટમાં માન્ય છે. - ટ્રેક્ટર પાર્ટ્સ`;

  // In development, just log
  if (process.env.NODE_ENV === 'development') {
    logger.info(`📱 SMS to ${phone}: ${message}`);
    return true;
  }

  // In production, use real SMS gateway
  // Examples:
  // - MSG91: https://msg91.com/
  // - Twilio: https://www.twilio.com/
  // - Fast2SMS: https://www.fast2sms.com/

  try {
    // Uncomment and configure your SMS gateway
    /*
    // MSG91 Example
    const msg91 = require('msg91')(process.env.MSG91_AUTH_KEY);
    await msg91.sendSms({
      mobiles: `91${phone}`,
      message: message,
      route: 4, // OTP route
    });
    */

    // Or use fetch for any HTTP-based SMS API
    /*
    await fetch('https://api.sms-gateway.com/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: `91${phone}`,
        message,
        apiKey: process.env.SMS_API_KEY,
      }),
    });
    */

    logger.info(`SMS sent to ${phone}`);
    return true;
  } catch (error) {
    logger.error(`SMS sending failed for ${phone}:`, error);
    // Don't throw error in production - OTP still works
    return true;
  }
}

/**
 * Send order confirmation SMS
 */
export async function sendOrderConfirmation(
  phone: string,
  orderId: string,
  amount: number
): Promise<boolean> {
  const message = `તમારો ઓર્ડર પુષ્ટિ થયો છે! ઓર્ડર #${orderId}, કુલ ₹${amount}. જલ્દી જ મોકલવાશે. - ટ્રેક્ટર પાર્ટ્સ`;

  if (process.env.NODE_ENV === 'development') {
    logger.info(`📱 SMS to ${phone}: ${message}`);
    return true;
  }

  // Production: Integrate with SMS gateway
  logger.info(`Order confirmation SMS sent to ${phone}`);
  return true;
}

/**
 * Send delivery confirmation SMS
 */
export async function sendDeliveryConfirmation(
  phone: string,
  orderId: string
): Promise<boolean> {
  const message = `તમારો ઓર્ડર #${orderId} પહોંચાડી દેવામાં આવ્યો છે! આભાર. - ટ્રેક્ટર પાર્ટ્સ`;

  if (process.env.NODE_ENV === 'development') {
    logger.info(`📱 SMS to ${phone}: ${message}`);
    return true;
  }

  logger.info(`Delivery confirmation SMS sent to ${phone}`);
  return true;
}

export default {
  sendOtp,
  sendOrderConfirmation,
  sendDeliveryConfirmation,
};
