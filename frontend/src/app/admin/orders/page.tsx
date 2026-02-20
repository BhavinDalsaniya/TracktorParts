'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import { ORDER_STATUS } from '@/config/constants';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store';

interface AdminOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  user: {
    name: string;
    phone: string;
  };
  shippingAddress: {
    city: string;
    state: string;
  };
}

interface OrdersResponse {
  orders: AdminOrder[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    // Don't check auth until Zustand has hydrated from localStorage
    if (!hasHydrated) return;

    // Check if user is authenticated and is admin
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }

    fetchOrders();
  }, [isAuthenticated, user, router, hasHydrated]);

  const fetchOrders = async () => {
    try {
      const response = await api.get<OrdersResponse>('/api/orders/admin/all', { limit: 50 });
      setOrders(response.orders || []);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.patch('/api/orders/admin/' + orderId + '/status', { status });
      fetchOrders();
    } catch {
      alert('Failed to update status');
    }
  };

  const filteredOrders = filter
    ? orders.filter((o) => o.status === filter)
    : orders;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-primary-500 px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">Orders</h1>
        </div>
      </header>

      <main className="px-4 py-4">
        {/* Filter Tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => setFilter('')} className={'flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold ' + (filter === '' ? 'bg-primary-500 text-white' : 'bg-white text-gray-700')}>
            All
          </button>
          <button onClick={() => setFilter('pending')} className={'flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold ' + (filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-white text-gray-700')}>
            Pending
          </button>
          <button onClick={() => setFilter('confirmed')} className={'flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold ' + (filter === 'confirmed' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700')}>
            Confirmed
          </button>
          <button onClick={() => setFilter('shipped')} className={'flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold ' + (filter === 'shipped' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700')}>
            Shipped
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const statusInfo = ORDER_STATUS[order.status as keyof typeof ORDER_STATUS] || ORDER_STATUS.pending;
              
              return (
                <div key={order.id} className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">{order.user.name} - {order.user.phone}</p>
                      <p className="text-sm text-gray-600">{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                    </div>
                    <span className={'rounded-full px-3 py-1 text-xs font-semibold ' + statusInfo.color + ' text-white'}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="mb-3 flex items-center justify-between border-t border-gray-100 pt-3">
                    <p className="text-base text-gray-600">Total: <span className="font-bold text-primary-600">{formatPrice(order.total)}</span></p>
                    <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('gu-IN')}</p>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => router.push('/admin/orders/' + order.id)} className="flex-1 rounded-xl bg-primary-500 py-2.5 text-sm font-semibold text-white">
                      View Details
                    </button>
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="rounded-xl border-2 border-gray-200 bg-white px-3 py-2 text-sm font-semibold"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              );
            })}

            {filteredOrders.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-base text-gray-600">No orders found</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
