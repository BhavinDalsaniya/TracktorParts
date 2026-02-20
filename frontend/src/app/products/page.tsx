import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { ProductGrid } from '@/components/ProductGrid';
import { FilterBar } from '@/components/FilterBar';
import { api } from '@/lib/api';
import { gu } from '@/config/constants';
import type { Product } from '@/types';

interface ProductsPageProps {
  searchParams: {
    page?: string;
    category?: string;
    brand?: string;
    sort?: string;
    q?: string;
  };
}

interface ProductsDataResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

async function getProducts(params: ProductsPageProps['searchParams']) {
  try {
    const response = await api.get<ProductsDataResponse>('/api/products', {
      page: parseInt(params.page || '1'),
      limit: 20,
      categoryId: params.category,
      brand: params.brand,
      sort: params.sort || 'popular',
      search: params.q,
    });
    return response;
  } catch {
    return { products: [], total: 0, page: 1, totalPages: 1 };
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const data = await getProducts(searchParams);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={gu.products} showBack />

      <main className="pb-24">
        {/* Filters */}
        <FilterBar currentParams={searchParams} />

        {/* Product Count */}
        <div className="px-4 py-3">
          <p className="text-sm text-gray-600">
            {data.total} {gu.products}
          </p>
        </div>

        {/* Products */}
        <div className="px-4">
          <ProductGrid products={data.products} />
        </div>

        {/* Empty State */}
        {data.products.length === 0 && (
          <div className="px-4 py-12 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <span className="text-4xl">🔍</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              કોઈ પાર્ટ્સ મળ્યું નથી
            </h3>
            <p className="mt-2 text-base text-gray-600">
              અન્ય ફિલ્ટર પ્રયત્ન કરો
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
