'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import { ORDER_STATUS } from '@/config/constants';
import { api } from '@/lib/api';

interface OrderDetail {
  id: string;
  orderNumber: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    total: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  shippingAddress: {
    fullName: string;
    city: string;
    state: string;
    pincode: string;
  };
  trackingNumber?: string;
}

interface OrderDetailResponse {
  data: {
    order: OrderDetail;
  };
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const response = await api.get<OrderDetailResponse>('/api/orders/' + params.id);
      setOrder(response.data.order);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" /></div>;
  }

  if (!order) {
    return <div className="flex min-h-screen flex-col items-center justify-center px-4"><p className="text-lg">Order not found</p><button onClick={() => router.back()} className="btn-lg mt-4 bg-primary-500 text-white">Go Back</button></div>;
  }

  const statusInfo = ORDER_STATUS[order.status as keyof typeof ORDER_STATUS] || ORDER_STATUS.pending;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-xl font-bold">Order Details</h1>
        </div>
      </header>

      <main className="pb-24">
        <div className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="rounded-full px-4 py-2 text-base font-semibold bg-blue-500 text-white">{statusInfo.label}</span>
          </div>
          {order.trackingNumber && <div className="mt-4 rounded-xl bg-gray-50 p-3"><p className="text-base font-semibold">{order.trackingNumber}</p></div>}
        </div>

        <div className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold">Items</h2>
          <div className="mt-3 divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3 py-3">
                <div className="flex flex-1 flex-col justify-between">
                  <p className="text-base font-semibold">{item.productName}</p>
                  <div className="flex items-center justify-between"><p className="text-sm text-gray-600">Qty: {item.quantity}</p><p className="text-base font-bold text-primary-600">{formatPrice(item.total)}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold">Price Details</h2>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-base"><span className="text-gray-600">Subtotal</span><span className="font-medium">{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between text-base"><span className="text-gray-600">Shipping</span><span className={"font-medium " + (order.shipping === 0 ? "text-green-600" : "")}>{order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}</span></div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-lg"><span className="font-bold">Total</span><span className="font-bold text-primary-600">{formatPrice(order.total)}</span></div>
          </div>
        </div>

        <div className="mx-4 mt-6"><button onClick={() => router.push("/")} className="btn-lg w-full border-2 border-primary-500 text-primary-600">Continue Shopping</button></div>
      </main>
    </div>
  );
}
