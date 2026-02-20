/**
 * Payment Service - Razorpay integration
 * Optional online payment with COD fallback
 */

import crypto from 'crypto';
import { logger } from '@/utils/logger';
import { prisma } from '@/config/database';

interface CreateOrderParams {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
  customer: {
    name: string;
    email?: string;
    contact: string;
  };
}

interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  notes: Record<string, string>;
  created_at: number;
}

interface VerifyPaymentParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

class RazorpayService {
  private keyId: string;
  private keySecret: string;
  private enabled: boolean;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    this.enabled = !!(this.keyId && this.keySecret);
  }

  /**
   * Check if Razorpay is configured
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Create order on Razorpay
   */
  async createOrder(params: CreateOrderParams): Promise<RazorpayOrder | null> {
    if (!this.enabled) {
      logger.warn('Razorpay not configured, skipping online payment');
      return null;
    }

    try {
      const amountInPaisa = Math.round(params.amount * 100); // Razorpay uses paisa

      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')}`,
        },
        body: JSON.stringify({
          amount: amountInPaisa,
          currency: params.currency || 'INR',
          receipt: params.receipt,
          notes: params.notes,
          payment_capture: 1, // Auto-capture payment
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Razorpay order creation failed:', error);
        return null;
      }

      const order = await response.json() as RazorpayOrder;
      logger.info(`Razorpay order created: ${order.id}`);
      return order;
    } catch (error) {
      logger.error('Razorpay API error:', error);
      return null;
    }
  }

  /**
   * Verify payment signature
   */
  verifySignature(params: VerifyPaymentParams): boolean {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params;

    if (!this.enabled) {
      logger.warn('Razorpay not configured, signature verification skipped');
      return false;
    }

    // Generate expected signature
    const generatedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = generatedSignature === razorpay_signature;

    if (!isValid) {
      logger.warn('Invalid Razorpay signature');
    }

    return isValid;
  }

  /**
   * Fetch payment details from Razorpay
   */
  async getPayment(paymentId: string): Promise<any> {
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.error('Razorpay fetch payment failed:', error);
      return null;
    }
  }

  /**
   * Process refund
   */
  async processRefund(paymentId: string, amount: number): Promise<boolean> {
    if (!this.enabled) {
      logger.warn('Razorpay not configured, refund skipped');
      return false;
    }

    try {
      const amountInPaisa = Math.round(amount * 100);

      const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')}`,
        },
        body: JSON.stringify({
          amount: amountInPaisa,
          speed: 'optimum',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Razorpay refund failed:', error);
        return false;
      }

      const refund = await response.json() as { id: string } | null;
      if (refund) {
        logger.info(`Razorpay refund initiated: ${refund.id}`);
      }
      return true;
    } catch (error) {
      logger.error('Razorpay refund error:', error);
      return false;
    }
  }

  /**
   * Get available payment methods
   */
  getAvailableMethods(): string[] {
    const methods = ['cod']; // Always available

    if (this.enabled) {
      methods.push('upi', 'card', 'netbanking', 'wallet', 'emi');
    }

    return methods;
  }
}

// Export singleton instance
export const razorpayService = new RazorpayService();

// Helper functions for order management
export async function createPaymentOrder(
  orderId: string,
  amount: number,
  user: { name: string; phone: string; email?: string }
): Promise<{ razorpayOrder?: RazorpayOrder; amountInPaisa: number; keyId?: string }> {
  const razorpayOrder = await razorpayService.createOrder({
    amount,
    currency: 'INR',
    receipt: orderId,
    notes: {
      orderId,
      customer_phone: user.phone,
    },
    customer: {
      name: user.name,
      email: user.email,
      contact: user.phone,
    },
  });

  return {
    razorpayOrder: razorpayOrder || undefined,
    amountInPaisa: Math.round(amount * 100),
    keyId: razorpayOrder ? process.env.RAZORPAY_KEY_ID : undefined,
  };
}

export async function verifyAndConfirmOrder(
  orderId: string,
  params: VerifyPaymentParams
): Promise<{ success: boolean; message: string }> {
  const isValid = razorpayService.verifySignature(params);

  if (!isValid) {
    return { success: false, message: 'ચુકવણી પુષ્ટિ થઈ શક્ય નથી' };
  }

  const payment = await razorpayService.getPayment(params.razorpay_payment_id);

  if (!payment || payment.status !== 'captured') {
    return { success: false, message: 'ચુકવણી પૂર્ણ થઈ શક્ય નથી' };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, paymentStatus: true, status: true },
  });

  if (!order) {
    return { success: false, message: 'ઓર્ડર મળ્યો નથી' };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'COMPLETED',
      paymentId: params.razorpay_payment_id,
      paymentResponse: payment,
      status: 'CONFIRMED',
      confirmedAt: new Date(),
    },
  });

  logger.info(`Order confirmed via Razorpay: ${orderId}`);

  return { success: true, message: 'ચુકવણી પૂર્ણ થઈ ગઈ' };
}

export async function handlePaymentFailure(
  orderId: string,
  params: VerifyPaymentParams
): Promise<void> {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'FAILED',
      paymentResponse: {
        error: 'Payment failed',
        razorpay_payment_id: params.razorpay_payment_id,
      },
    },
  });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      items: {
        select: {
          productId: true,
          quantity: true,
        },
      },
    },
  });

  if (order) {
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  }

  logger.info(`Order payment failed, inventory restored: ${orderId}`);
}

export default razorpayService;
