'use client';

import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { CartItem } from '@/components/CartItem';
import { WhatsAppOrderButton } from '@/components/WhatsAppButton';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store';
import { formatPrice, cn } from '@/lib/utils';
import { gu } from '@/config/constants';

export default function CartPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const shipping = subtotal >= 999 ? 0 : 50;
  const tax = Math.round(subtotal * 0.18); // 18% GST
  const total = subtotal + shipping + tax;

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title={gu.cart} showBack />
        <main className="flex min-h-[calc(100vh-120px)] flex-col items-center justify-center px-4 pb-24">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{gu.cartEmpty}</h2>
            <p className="mt-2 text-base text-gray-600">
              પહેલા કેટલીક વસ્તુઓ ઉમેરો
            </p>
            <button
              onClick={() => router.push('/')}
              className="btn-lg mt-6 bg-primary-500 text-white"
            >
              {gu.continueShopping}
            </button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={`${gu.cart} (${itemCount})`} showBack />

      <main className="pb-40">
        {/* Cart Items */}
        <div className="divide-y divide-gray-200">
          {items.map((item) => (
            <CartItem key={item.product.id} item={item} />
          ))}
        </div>

        {/* Clear Cart */}
        <div className="px-4 py-3">
          <button
            onClick={clearCart}
            className="text-base font-medium text-red-600"
          >
            બધી વસ્તુઓ દૂર કરો
          </button>
        </div>

        {/* Price Summary */}
        <div className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">સરવાળો</h3>

          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-base">
              <span className="text-gray-600">{gu.subtotal}</span>
              <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
            </div>

            <div className="flex justify-between text-base">
              <span className="text-gray-600">{gu.shipping}</span>
              <span className={cn('font-medium', shipping === 0 ? 'text-green-600' : 'text-gray-900')}>
                {shipping === 0 ? gu.freeShipping : formatPrice(shipping)}
              </span>
            </div>

            <div className="flex justify-between text-base">
              <span className="text-gray-600">GST (18%)</span>
              <span className="font-medium text-gray-900">{formatPrice(tax)}</span>
            </div>

            <div className="flex justify-between border-t border-gray-200 pt-2 text-lg">
              <span className="font-bold text-gray-900">{gu.total}</span>
              <span className="font-bold text-primary-600">{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        {/* Free Shipping Notice */}
        {subtotal < 999 && (
          <div className="mx-4 mt-3 rounded-xl bg-primary-50 p-3 text-center">
            <p className="text-base font-medium text-primary-700">
              ₹{999 - subtotal} વધુ ઉમેરો અને {gu.freeShipping} મેળવો!
            </p>
          </div>
        )}
      </main>

      {/* Fixed Bottom Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-bottom">
        <div className="px-4 py-3 space-y-2">
          <button
            onClick={handleCheckout}
            className="btn-xl w-full bg-primary-500 text-white"
          >
            {gu.checkout} - {formatPrice(total)}
          </button>
          <WhatsAppOrderButton cartItems={items} />
        </div>
      </div>
    </div>
  );
}
