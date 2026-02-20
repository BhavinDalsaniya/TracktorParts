'use client';

import { MessageCircle } from 'lucide-react';
import { gu } from '@/config/constants';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
  productInfo?: {
    name: string;
    id: string;
  };
}

export function WhatsAppButton({
  phoneNumber = '919876543210', // Default WhatsApp number (replace with actual)
  message = 'મને આ ટ્રેક્ટર પાર્ટ વિશે માહિતી જોઈએ છે', // Default message: "I need information about this tractor part"
  productInfo,
}: WhatsAppButtonProps) {
  // Build WhatsApp URL with pre-filled message
  const buildWhatsAppUrl = () => {
    let fullMessage = message;

    // If product info is provided, include it in the message
    if (productInfo) {
      fullMessage = `હેલો, મને ${productInfo.name} (ID: ${productInfo.id}) વિશે માહિતી જોઈએ છે. શું આ ઉપલબ્ધ છે?`;
      // English: "Hello, I need information about {product name} (ID: {id}). Is this available?"
    }

    const encodedMessage = encodeURIComponent(fullMessage);
    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  };

  const handleClick = () => {
    const url = buildWhatsAppUrl();
    window.open(url, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-green-500 px-4 py-3 shadow-lg transition-all hover:bg-green-600 active:scale-95 sm:bottom-28 sm:right-6"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-6 w-6 text-white" strokeWidth={2.5} />
      <span className="text-base font-bold text-white">મદદ</span>
      {/* Badge for new message indicator */}
      <span className="absolute -right-1 -top-1 flex h-4 w-4">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500"></span>
      </span>
    </button>
  );
}

/**
 * WhatsApp Order Button - For placing manual orders
 */
interface WhatsAppOrderButtonProps {
  phoneNumber?: string;
  productInfo?: {
    name: string;
    id: string;
    price: number;
  };
  cartItems?: Array<{
    product: { name: string; id: string };
    quantity: number;
  }>;
}

export function WhatsAppOrderButton({
  phoneNumber = '919876543210',
  productInfo,
  cartItems,
}: WhatsAppOrderButtonProps) {
  const buildOrderMessage = () => {
    let message = 'હેલો, હું નીચેના પાર્ટ્સ ઓર્ડર કરવા માંગુ છું:\n\n';
    // English: "Hello, I want to order the following parts:\n\n"

    if (productInfo) {
      message += `• ${productInfo.name}\n`;
      message += `  કિંમત: ₹${productInfo.price}\n`;
      message += `  જથ્થો: 1\n\n`;
    } else if (cartItems && cartItems.length > 0) {
      cartItems.forEach((item, index) => {
        message += `${index + 1}. ${item.product.name} - ${item.quantity} પીસ\n`;
      });
      message += '\nકૃપા કરીને ઓર્ડર પુષ્ટિ કરો.';
      // English: "Please confirm the order."
    }

    message += '\n\nસરનામું અને ચુકવણી વિગતે જણાવો.';
    // English: "Please provide address and payment details."

    return message;
  };

  const handleClick = () => {
    const message = buildOrderMessage();
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(url, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-3.5 font-semibold text-white transition-colors hover:bg-green-600 active:scale-[0.98]"
    >
      <MessageCircle className="h-5 w-5" strokeWidth={2.5} />
      WhatsApp પર ઓર્ડર કરો
    </button>
  );
}
