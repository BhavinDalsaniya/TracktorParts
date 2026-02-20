'use client';

import { Header } from '@/components/layout/Header';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store';
import { formatPrice } from '@/lib/utils';
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface OrderData {
  items: any[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  customerDetails: {
    fullName: string;
    email: string;
    mobileNumber: string;
    address: string;
    state: string;
    district: string;
    pincode: string;
  };
}

export default function PaymentPage() {
  const router = useRouter();
  const { clearCart } = useCartStore();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    // Get order data from session storage
    const pendingOrder = sessionStorage.getItem('pendingOrder');
    if (!pendingOrder) {
      router.push('/cart');
      return;
    }
    setOrderData(JSON.parse(pendingOrder));

    return () => {
      // Cleanup script
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [router]);

  const handlePayment = async () => {
    if (!orderData || !razorpayLoaded) return;

    setIsLoading(true);

    try {
      // First, create the order in the database
      const createOrderResponse = await fetch('http://localhost:5000/api/orders/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: orderData.items,
          subtotal: orderData.subtotal,
          shipping: orderData.shipping,
          tax: orderData.tax,
          total: orderData.total,
          customerDetails: orderData.customerDetails,
          paymentMethod: 'online',
        }),
      });

      if (!createOrderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const orderResult = await createOrderResponse.json();
      const orderId = orderResult.data?.id;

      if (!orderId) {
        throw new Error('Order ID not received');
      }

      // Now create Razorpay order
      const razorpayOrderResponse = await fetch('http://localhost:5000/api/payment/create-order-guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount: orderData.total,
          customerDetails: orderData.customerDetails,
        }),
      });

      if (!razorpayOrderResponse.ok) {
        throw new Error('Failed to create payment order');
      }

      const razorpayOrderResult = await razorpayOrderResponse.json();

      if (!razorpayOrderResult.success || !razorpayOrderResult.data.razorpayOrderId) {
        throw new Error('Razorpay order creation failed');
      }

      // Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_HERE',
        amount: razorpayOrderResult.data.amountInPaisa,
        currency: 'INR',
        name: 'ટ્રેક્ટર પાર્ટ્સ',
        description: `Order ${orderId}`,
        order_id: razorpayOrderResult.data.razorpayOrderId,
        prefill: {
          name: orderData.customerDetails.fullName,
          email: orderData.customerDetails.email || '',
          contact: orderData.customerDetails.mobileNumber,
        },
        notes: {
          orderId,
        },
        theme: {
          color: '#059669',
        },
        handler: async function (response: any) {
          // Payment successful
          const verifyResponse = await fetch('http://localhost:5000/api/payment/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          if (verifyResponse.ok) {
            // Clear cart and session storage
            clearCart();
            sessionStorage.removeItem('pendingOrder');
            // Redirect to success page
            router.push(`/orders?success=true&orderId=${orderId}`);
          } else {
            alert('પેમેન્ટ પુષ્ટિ નિષ્ફળ. સપોર્ટનો સંપર્ક કરો.');
          }
          setIsLoading(false);
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async function (response: any) {
        // Handle payment failure
        await fetch('http://localhost:5000/api/payment/failed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            razorpay_order_id: response.error.metadata.order_id,
            razorpay_payment_id: response.error.metadata.payment_id,
          }),
        });
        alert('પેમેન્ટ નિષ્ફળ થયું. કૃપા કરીને ફરી પ્રયત્ન કરો.');
        setIsLoading(false);
      });

      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      alert('પેમેન્ટ નિષ્ફળ. કૃપા કરીને ફરી પ્રયત્ન કરો.');
      setIsLoading(false);
    }
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="પેમેન્ટ" showBack />
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-gray-600">લોડ થઈ રહ્યું છે...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="પેમેન્ટ" showBack />

      <main className="pb-32">
        {/* Order Summary */}
        <div className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-3">ઓર્ડર સારાંશ</h3>

          {/* Items */}
          <div className="space-y-2 mb-4">
            {orderData.items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.product.nameGu || item.product.name} x {item.quantity}
                </span>
                <span className="font-medium">
                  {formatPrice(
                    (typeof item.product.price === 'string'
                      ? parseFloat(item.product.price)
                      : item.product.price) * item.quantity
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-3 space-y-2">
            <div className="flex justify-between text-base">
              <span className="text-gray-600">ઉપ-સરવાળો</span>
              <span className="font-medium">{formatPrice(orderData.subtotal)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-gray-600">શિપિંગ</span>
              <span className={orderData.shipping === 0 ? 'font-medium text-green-600' : 'font-medium'}>
                {orderData.shipping === 0 ? 'મફત' : formatPrice(orderData.shipping)}
              </span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-gray-600">GST (18%)</span>
              <span className="font-medium">{formatPrice(orderData.tax)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-lg">
              <span className="font-bold text-gray-900">કુલ</span>
              <span className="font-bold text-primary-600">{formatPrice(orderData.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Details */}
        <div className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-3">ડિલિવરી વિગતો</h3>

          <div className="space-y-2 text-sm">
            <p className="text-gray-900 font-medium">{orderData.customerDetails.fullName}</p>
            {orderData.customerDetails.email && (
              <p className="text-gray-600">{orderData.customerDetails.email}</p>
            )}
            <p className="text-gray-600">{orderData.customerDetails.mobileNumber}</p>
            <p className="text-gray-600">{orderData.customerDetails.address}</p>
            <p className="text-gray-600">
              {orderData.customerDetails.district}, {orderData.customerDetails.state}
            </p>
            <p className="text-gray-600">પિનકોડ: {orderData.customerDetails.pincode}</p>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-3">પેમેન્ટ પદ્ધતિ</h3>

          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-primary-500 bg-primary-50">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500">
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">ઓનલાઇન પેમેન્ટ</p>
                <p className="text-xs text-gray-600">UPI, કાર્ડ, નેટબેંકિંગ</p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Mode Notice */}
        {!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.includes('test') ? (
          <div className="mx-4 mt-4 rounded-xl bg-yellow-50 p-3">
            <p className="text-xs font-medium text-yellow-800">
              ⚠️ ટેસ્ટ મોડ: ટેસ્ટ કાર્ડ/UPI વિગતો વાપરો
            </p>
          </div>
        ) : null}
      </main>

      {/* Fixed Bottom Payment Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-bottom">
        <div className="px-4 py-3">
          <button
            onClick={handlePayment}
            disabled={isLoading || !razorpayLoaded}
            className={cn(
              'btn-xl w-full',
              isLoading || !razorpayLoaded
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary-500 hover:bg-primary-600'
            , 'text-white')}
          >
            {!razorpayLoaded
              ? 'લોડ થઈ રહ્યું છે...'
              : isLoading
              ? 'પ્રક્રિયા થઈ રહી છે...'
              : `ચુકવણી કરો - ${formatPrice(orderData.total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
