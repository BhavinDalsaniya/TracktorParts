'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { ProductGrid } from '@/components/ProductGrid';
import { SearchBar } from '@/components/SearchBar';
import { debounce } from '@/lib/utils';
import { api } from '@/lib/api';
import type { Product } from '@/types';

interface ProductsResponse {
  products: Product[];
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(query);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search function
  const debouncedSearch = debounce(async (q: string) => {
    if (!q.trim()) {
      setProducts([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get<ProductsResponse>('/api/products', {
        search: q,
        limit: 20,
      });
      setProducts(response.products || []);
    } finally {
      setLoading(false);
    }
  }, 500);

  useEffect(() => {
    if (query) {
      debouncedSearch(query);
    }
  }, [query]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (q.trim()) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBack />

      <main className="pb-24">
        {/* Search Bar */}
        <div className="px-4 py-4">
          <SearchBar defaultValue={query} />
        </div>

        {/* Results */}
        <div className="px-4">
          {query && (
            <p className="mb-3 text-base text-gray-600">
              "{query}" ના પરિણામો
            </p>
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton aspect-square rounded-2xl" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <ProductGrid products={products} />
          ) : query ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                કોઈ પરિણામ મળ્યું નથી
              </h3>
              <p className="mt-2 text-base text-gray-600">
                અન્ય શબ્દ પ્રયત્ન કરો
              </p>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-base text-gray-600">
                પાર્ટ્સ શોધવા માટે ઉપર લખો
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
