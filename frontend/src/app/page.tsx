import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { CategoryGrid } from '@/components/CategoryGrid';
import { ProductGrid } from '@/components/ProductGrid';
import { Banner } from '@/components/Banner';
import { SearchBar } from '@/components/SearchBar';
import { api } from '@/lib/api';
import { gu } from '@/config/constants';
import type { Category, Product } from '@/types';

interface CategoriesResponse {
  categories: Category[];
}

interface ProductsResponse {
  products: Product[];
}

async function getHomePageData() {
  try {
    const [categoriesRes, productsRes] = await Promise.all([
      api.get<{ success: boolean; data: Category[] }>('/api/categories').catch((): { success: boolean; data: Category[] } => ({ success: false, data: [] })),
      api.get<{ success: boolean; data: { products: Product[] } }>('/api/products', { limit: 1000 }).catch((): { success: boolean; data: { products: Product[] } } => ({ success: false, data: { products: [] } })),
    ]);

    return {
      categories: categoriesRes.data || [],
      products: productsRes.data?.products || [],
    };
  } catch (error) {
    return {
      categories: [],
      products: [],
    };
  }
}

export default async function HomePage() {
  const { categories, products } = await getHomePageData();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showSearch />

      <main className="pb-24">
        {/* Hero Banner */}
        <section className="px-4 pt-4 pb-6">
          <Banner
            title="ટ્રેક્ટર પાર્ટ્સ"
            subtitle="શ્રેષ્ઠ ગુણવત્તા, ઓછી કિંમત"
            image="/banner.jpg"
          />
        </section>

        {/* Search Bar */}
        <section className="px-4 pb-4">
          <SearchBar placeholder="પાર્ટ્સ શોધો..." />
        </section>

        {/* Categories */}
        <section className="px-4 pb-6">
          <div className="mb-3">
            <h2 className="text-xl font-bold text-gray-900">{gu.categories}</h2>
          </div>
          <CategoryGrid categories={categories} />
        </section>

        {/* Featured Products */}
        <section className="px-4 pb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">લોકપ્રિય પાર્ટ્સ</h2>
          </div>
          <ProductGrid products={products} />
        </section>

        {/* CTA Banner */}
        {products.length === 0 && (
          <section className="px-4 pb-6">
            <div className="rounded-2xl bg-primary-50 p-6 text-center">
              <p className="text-lg font-semibold text-primary-700">
                ઝડપી ડિલિવરી
              </p>
              <p className="text-base text-primary-600">
                ગુજરાતભરમાં 5-7 દિવસમાં
              </p>
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
