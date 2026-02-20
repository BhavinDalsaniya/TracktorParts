'use client';

import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { CartItem } from '@/components/CartItem';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store';
import { formatPrice, cn } from '@/lib/utils';
import { gu } from '@/config/constants';
import { useState } from 'react';

interface FormData {
  fullName: string;
  email: string;
  mobileNumber: string;
  address: string;
  state: string;
  district: string;
  pincode: string;
}

export default function CartPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    mobileNumber: '',
    address: '',
    state: '',
    district: '',
    pincode: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const shipping = subtotal >= 999 ? 0 : 50;
  const tax = Math.round(subtotal * 0.18); // 18% GST
  const total = subtotal + shipping + tax;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    }
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.mobileNumber.trim())) {
      newErrors.mobileNumber = 'Please enter valid mobile number';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.district.trim()) {
      newErrors.district = 'District is required';
    }
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^[1-9]\d{5}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Please enter valid pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = () => {
    if (!validateForm()) {
      return;
    }

    // Create order data
    const orderData = {
      items,
      subtotal,
      shipping,
      tax,
      total,
      customerDetails: formData,
    };

    // Store order data temporarily
    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));

    // Navigate to payment page
    router.push('/payment');
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

      <main className="pb-52">
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

        {/* Customer Details Form */}
        <div className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-3">ડિલિવરી વિગતો</h3>

          <div className="space-y-3">
            {/* Full Name */}
            <div>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="પૂરું નામ *"
                className={cn(
                  'w-full rounded-xl border px-4 py-3 text-base',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
              )}
            </div>

            {/* Email (Optional) */}
            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="ઈમેલ (વૈકલ્પિક)"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                placeholder="મોબાઇલ નંબર *"
                maxLength={10}
                className={cn(
                  'w-full rounded-xl border px-4 py-3 text-base',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  errors.mobileNumber ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.mobileNumber && (
                <p className="mt-1 text-xs text-red-600">{errors.mobileNumber}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <textarea
                name="address"
                value={formData.address}
                onChange={(e) => handleInputChange(e as any)}
                placeholder="સરનામું *"
                rows={2}
                className={cn(
                  'w-full rounded-xl border px-4 py-3 text-base',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  errors.address ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.address && (
                <p className="mt-1 text-xs text-red-600">{errors.address}</p>
              )}
            </div>

            {/* State & District */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="રાજ્ય *"
                  className={cn(
                    'w-full rounded-xl border px-4 py-3 text-base',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500',
                    errors.state ? 'border-red-500' : 'border-gray-300'
                  )}
                />
                {errors.state && (
                  <p className="mt-1 text-xs text-red-600">{errors.state}</p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="જિલ્લો *"
                  className={cn(
                    'w-full rounded-xl border px-4 py-3 text-base',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500',
                    errors.district ? 'border-red-500' : 'border-gray-300'
                  )}
                />
                {errors.district && (
                  <p className="mt-1 text-xs text-red-600">{errors.district}</p>
                )}
              </div>
            </div>

            {/* Pincode */}
            <div>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                placeholder="પિનકોડ *"
                maxLength={6}
                className={cn(
                  'w-full rounded-xl border px-4 py-3 text-base',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  errors.pincode ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.pincode && (
                <p className="mt-1 text-xs text-red-600">{errors.pincode}</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Payment Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-bottom">
        <div className="px-4 py-3">
          <button
            onClick={handlePayment}
            className="btn-xl w-full bg-primary-500 text-white"
          >
            ચુકવણી કરો - {formatPrice(total)}
          </button>
        </div>
      </div>
    </div>
  );
}
