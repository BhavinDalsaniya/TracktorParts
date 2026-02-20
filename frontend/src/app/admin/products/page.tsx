'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, ChevronLeft, Eye, Edit, Trash2, Pencil } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store';

interface Product {
  id: string;
  name: string;
  nameGu: string;
  price: number;
  stock: number;
  isActive: boolean;
  images: string[];
  sku: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    nameGu: string;
  };
}

interface ProductsResponse {
  products: Product[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated, clearAuth } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }

    fetchProducts();
  }, [isAuthenticated, user, router, hasHydrated]);

  const fetchProducts = async () => {
    try {
      const response = await api.get<{ success: boolean; data: ProductsResponse }>('/api/products', { page: '1', limit: '100' });
      setProducts(response.data?.products || []);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.nameGu?.includes(search) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const handleRowClick = (productId: string) => {
    router.push(`/admin/products/${productId}`);
  };

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
            <h1 className="text-xl font-bold text-white">Products</h1>
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white">
              {products.length}
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
              onClick={() => router.push('/admin/products/new')}
              className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-primary-600 font-semibold"
            >
              <Plus className="h-5 w-5" />
              Add Product
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
            placeholder="Search by name, SKU..."
            className="w-full rounded-2xl border-2 border-gray-200 bg-white py-3 pl-12 pr-4 focus:border-primary-500 focus:outline-none"
          />
        </div>

        {/* Image Stats Summary */}
        {!loading && products.length > 0 && (
          <div className="mb-4 rounded-xl bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">
                  <strong>{products.filter(p => p.images?.length > 0).length}</strong> with images
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-400"></div>
                <span className="text-sm text-gray-600">
                  <strong>{products.filter(p => !p.images?.length).length}</strong> without images
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
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Stock
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
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      onClick={() => handleRowClick(product.id)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        {product.images?.[0] ? (
                          <div className="h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
                            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200">
                            <span className="text-xs text-gray-400">No img</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{product.nameGu || product.name}</p>
                          <p className="text-sm text-gray-500 truncate">{product.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-gray-600">{product.sku}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-900">{formatPrice(product.price)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={'text-sm font-medium ' + (product.stock > 0 ? 'text-green-600' : 'text-red-600')}>
                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={'inline-flex rounded-full px-3 py-1 text-xs font-semibold ' + (product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/products/${product.id}`);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-gray-500 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-600"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/products/${product.id}/edit`);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-primary-500 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-600"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
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
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleRowClick(product.id)}
                  className="rounded-xl bg-white p-4 shadow-sm border-2 border-gray-100 hover:border-blue-300 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {product.images?.[0] && (
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{product.nameGu || product.name}</p>
                      <p className="text-sm text-gray-500">{product.name}</p>
                      <p className="text-xs font-mono text-gray-400 mt-1">SKU: {product.sku}</p>
                    </div>
                    <span className={'flex-shrink-0 rounded-full px-2 py-1 text-xs font-semibold ' + (product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex gap-4 text-sm">
                      <span className="font-semibold text-gray-900">{formatPrice(product.price)}</span>
                      <span className={'font-medium ' + (product.stock > 0 ? 'text-green-600' : 'text-red-600')}>
                        Stock: {product.stock}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/products/${product.id}`);
                        }}
                        className="flex items-center gap-1 rounded-lg bg-gray-500 px-3 py-1.5 text-sm font-semibold text-white"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/products/${product.id}/edit`);
                        }}
                        className="flex items-center gap-1 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-semibold text-white"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-gray-500">No products found</p>
                <button
                  onClick={() => router.push('/admin/products/new')}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-500 px-6 py-2 text-white font-semibold hover:bg-primary-600"
                >
                  <Plus className="h-5 w-5" />
                  Add First Product
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
