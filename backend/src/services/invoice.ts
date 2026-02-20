/**
 * Invoice Service - GST compliant
 * Generate invoice data for orders
 */

import type { Order } from '@prisma/client';

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  orderDetails: {
    orderNumber: string;
    orderDate: string;
  };
  seller: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gstin: string;
  };
  buyer: {
    name: string;
    phone: string;
    address: string;
  };
  items: Array<{
    description: string;
    hsnCode: string;
    quantity: number;
    unitPrice: number;
    tax: number;
    total: number;
  }>;
  summary: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
    totalInWords: string;
  };
  gstSummary: {
    cgst: number;
    sgst: number;
    igst: number;
  };
}

/**
 * Generate GST invoice data
 */
export function generateInvoice(order: any): InvoiceData {
  // Seller details (from environment or config)
  const seller = {
    name: process.env.COMPANY_NAME || 'ટ્રેક્ટર પાર્ટ્સ',
    address: process.env.COMPANY_ADDRESS || 'ગુજરાત, ભારત',
    phone: process.env.COMPANY_PHONE || '9876543210',
    email: process.env.COMPANY_EMAIL || 'support@tractorparts.com',
    gstin: process.env.COMPANY_GSTIN || '24ABCDE1234F1Z5',
  };

  // Generate invoice number
  const invoiceNumber = `INV-${order.orderNumber}`;

  // Buyer details
  const address = order.shippingAddress;
  const buyer = {
    name: order.user.name,
    phone: order.user.phone,
    address: `${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''}, ${address.city}-${address.pincode}, ${address.district}, ${address.state}`,
  };

  // Map items
  const items = order.items.map((item: any) => ({
    description: item.productNameGu || item.productName,
    hsnCode: '8708', // Tractor parts HSN code
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    tax: Number(item.tax),
    total: Number(item.total),
  }));

  const subtotal = Number(order.subtotal);
  const shipping = Number(order.shipping);
  const tax = Number(order.tax);
  const discount = Number(order.discount || 0) + Number(order.couponDiscount || 0);
  const total = Number(order.total);

  // GST breakdown (18% = 9% CGST + 9% SGST for intra-state)
  const isGujarat = address.state === 'Gujarat';
  const gstSummary = isGujarat
    ? {
        cgst: tax / 2,
        sgst: tax / 2,
        igst: 0,
      }
    : {
        cgst: 0,
        sgst: 0,
        igst: tax,
      };

  return {
    invoiceNumber,
    invoiceDate: new Date().toISOString(),
    orderDetails: {
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
    },
    seller,
    buyer,
    items,
    summary: {
      subtotal,
      shipping,
      tax,
      discount,
      total,
      totalInWords: numberToIndianRupees(Math.round(total)),
    },
    gstSummary,
  };
}

/**
 * Convert number to Indian Rupees words (simplified)
 */
function numberToIndianRupees(num: number): string {
  const units = ['', 'હજાર', 'હજાર', 'લાખ', 'લાખ', 'કરોડ'];

  if (num === 0) return 'શૂન્ય રૂપિયા';

  // For simplicity, return basic format
  // In production, use a proper number-to-words library
  if (num < 1000) {
    return `${num} રૂપિયા`;
  }
  if (num < 100000) {
    return `${Math.floor(num / 1000)} હજાર ${num % 1000} રૂપિયા`;
  }
  return `${(num / 100000).toFixed(2)} લાખ રૂપિયા`;
}

export default {
  generateInvoice,
};
