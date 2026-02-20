'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { formatPrice } from '@/lib/utils';
import { gu, ORDER_STATUS } from '@/config/constants';
import { api } from '@/lib/api';

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: Array<{
    productName: string;
    quantity: number;
  }>;
}

interface OrdersListResponse {
  orders: Order[];
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get<OrdersListResponse>('/api/orders');
      setOrders(response.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title={gu.orders} showBack />
        <main className="flex min-h-[60vh] items-center justify-center pb-24">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={gu.orders} showBack />

      <main className="pb-24">
        {orders.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                <span className="text-4xl">📦</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">કોઈ ઓર્ડર નથી</h2>
              <p className="mt-2 text-base text-gray-600">હજી કોઈ ઓર્ડર મૂકયો નથી</p>
              <button
                onClick={() => router.push('/')}
                className="btn-lg mt-6 bg-primary-500 text-white"
              >
                ખરીદી કરો
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {orders.map((order) => {
              const statusInfo = ORDER_STATUS[order.status as keyof typeof ORDER_STATUS] || ORDER_STATUS.pending;

              return (
                <button
                  key={order.id}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  className="w-full bg-white px-4 py-4 text-left smooth-transition active:bg-gray-50"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {order.orderNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('gu-IN')}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusInfo.color} text-white`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        {order.items.length} વસ્તુઓ
                      </p>
                      <p className="text-lg font-bold text-primary-600 mt-1">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
