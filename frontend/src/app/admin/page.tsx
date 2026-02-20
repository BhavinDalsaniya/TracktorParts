'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store';

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  todayRevenue: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated, clearAuth } = useAuthStore();
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Track if component is mounted (client-side)
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Skip if not mounted yet (server-side render)
    if (!mounted) return;

    console.log('💧 Checking auth...', { isAuthenticated, hasHydrated, user });

    // Check if user is authenticated and is admin
    if (!isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to login');
      router.push('/admin/login');
      return;
    }

    if (user?.role !== 'ADMIN') {
      console.log('❌ Not admin, redirecting to user login');
      router.push('/auth/login');
      return;
    }

    console.log('✅ Auth check passed, fetching stats...');
    fetchStats();
  }, [mounted, isAuthenticated, user, router]);

  const fetchStats = async () => {
    try {
      const response = await api.get<Stats>('/api/orders/admin/stats');
      setStats(response);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: 'categories', label: 'Categories', icon: '🏷️', path: '/admin/categories' },
    { id: 'products', label: 'Products', icon: '📦', path: '/admin/products' },
    { id: 'orders', label: 'Orders', icon: '📋', path: '/admin/orders' },
    { id: 'users', label: 'Users', icon: '👥', path: '/admin/users' },
    { id: 'analytics', label: 'Analytics', icon: '📊', path: '/admin/analytics' },
  ];

  return (
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      <header className="sticky top-0 z-50 bg-primary-500 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={() => {
                clearAuth();
                router.push('/admin/login');
              }}
              className="flex h-10 items-center gap-2 rounded-full bg-red-500 px-4 text-sm font-semibold text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-primary-600">{formatPrice(stats.totalRevenue)}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold text-green-600">{formatPrice(stats.todayRevenue)}</p>
              </div>
            </div>

            {/* Menu */}
            <div className="mt-6">
              <h2 className="mb-3 text-lg font-bold">Management</h2>
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => router.push(item.path)}
                    className="btn-lg w-full flex items-center gap-3 bg-white text-gray-900"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-lg font-semibold">{item.label}</span>
                    <svg className="ml-auto h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
