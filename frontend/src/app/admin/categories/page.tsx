'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, ChevronLeft, Eye, Edit, Trash2, Pencil, Image as ImageIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store';

interface Category {
  id: string;
  name: string;
  nameGu: string;
  slug: string;
  image: string | null;
  displayOrder: number;
  featured: boolean;
  isActive: boolean;
  parent?: {
    id: string;
    name: string;
    nameGu: string;
  };
  _count?: {
    products: number;
    children: number;
  };
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated, clearAuth } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }

    fetchCategories();
  }, [isAuthenticated, user, router, hasHydrated]);

  const fetchCategories = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Category[] }>('/api/categories/admin/all');
      setCategories(response.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('શું તમે ચોક્કસ કાઢી નાખવા માંગો છો?')) return;

    setDeletingId(categoryId);
    try {
      await api.delete(`/api/categories/${categoryId}`);
      setCategories(categories.filter((c) => c.id !== categoryId));
    } catch (error) {
      alert('ભૂલ: શ્રેણી કાઢી નાખી શકાઈ નહીં');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.nameGu?.includes(search) ||
    c.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-primary-500 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Categories</h1>
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white">
              {categories.length}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                clearAuth();
                router.push('/admin/login');
              }}
              className="flex h-10 items-center gap-2 rounded-full bg-red-500 px-3 text-sm font-semibold text-white"
            >
              Logout
            </button>
            <button
              onClick={() => router.push('/admin/categories/new')}
              className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-primary-600 font-semibold"
            >
              <Plus className="h-5 w-5" />
              Add Category
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-4">
        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, slug..."
            className="w-full rounded-2xl border-2 border-gray-200 bg-white py-3 pl-12 pr-4 focus:border-primary-500 focus:outline-none"
          />
        </div>

        {/* Stats Summary */}
        {!loading && categories.length > 0 && (
          <div className="mb-4 rounded-xl bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">
                  <strong>{categories.filter(c => c.isActive).length}</strong> active
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                <span className="text-sm text-gray-600">
                  <strong>{categories.filter(c => !c.isActive).length}</strong> inactive
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  <strong>{categories.filter(c => c.image).length}</strong> with images
                </span>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Products
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCategories.map((category) => (
                    <tr
                      key={category.id}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        {category.image ? (
                          <div className="h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
                            <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200">
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">{category.nameGu || category.name}</p>
                          <p className="text-sm text-gray-500">{category.name}</p>
                          <p className="text-xs text-gray-400">/{category.slug}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-600">{category._count?.products || 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-gray-600">{category.displayOrder}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {category.featured && (
                            <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">
                              Featured
                            </span>
                          )}
                          <span className={'inline-flex rounded-full px-2 py-1 text-xs font-semibold ' + (category.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/admin/categories/${category.id}/edit`)}
                            className="inline-flex items-center gap-1 rounded-lg bg-primary-500 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-600"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            disabled={deletingId === category.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            {deletingId === category.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-xl bg-white p-4 shadow-sm border-2 border-gray-100"
                >
                  <div className="flex items-start gap-3">
                    {category.image ? (
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-16 w-16 flex-shrink-0 flex items-center justify-center rounded-lg bg-gray-200">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{category.nameGu || category.name}</p>
                      <p className="text-sm text-gray-500">{category.name}</p>
                      <p className="text-xs text-gray-400">/{category.slug}</p>
                    </div>
                    <span className={'flex-shrink-0 rounded-full px-2 py-1 text-xs font-semibold ' + (category.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex gap-4 text-sm">
                      <span className="font-medium text-gray-600">{category._count?.products || 0} products</span>
                      <span className="font-mono text-gray-400">Order: {category.displayOrder}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/admin/categories/${category.id}/edit`)}
                        className="flex items-center gap-1 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-semibold text-white"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        disabled={deletingId === category.id}
                        className="flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        {deletingId === category.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredCategories.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-gray-500">No categories found</p>
                <button
                  onClick={() => router.push('/admin/categories/new')}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-500 px-6 py-2 text-white font-semibold hover:bg-primary-600"
                >
                  <Plus className="h-5 w-5" />
                  Add First Category
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
