import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { api } from '@/lib/api';
import { gu } from '@/config/constants';
import Image from 'next/image';
import Link from 'next/link';
import type { Category } from '@/types';

interface CategoriesResponse {
  categories: Category[];
}

async function getCategories() {
  try {
    const response = await api.get<CategoriesResponse>('/api/categories');
    return response.categories || [];
  } catch {
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={gu.categories} showBack />

      <main className="pb-24 px-4 py-4">
        {categories.length === 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton h-40 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category: any) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-sm smooth-transition active:scale-[0.98]"
              >
                <div className="aspect-square overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.nameGu || category.name}
                      fill
                      sizes="(max-width: 360px) 50vw, 180px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-5xl text-primary-400">
                        {(category.nameGu || category.name).charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-lg font-bold text-white">
                    {category.nameGu || category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
