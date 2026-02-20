'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

interface CategoryGridProps {
  categories: Category[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="skeleton h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/categories/${category.slug}`}
          className="group flex flex-col items-center gap-2 smooth-transition active:scale-95"
        >
          <div
            className={cn(
              'relative h-20 w-20 overflow-hidden rounded-2xl',
              'bg-gradient-to-br from-primary-400 to-primary-600',
              'shadow-sm shadow-primary-200'
            )}
          >
            {category.image ? (
              <Image
                src={category.image}
                alt={category.nameGu || category.name}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-3xl font-bold text-white/80">
                  {category.nameGu?.charAt(0) || category.name?.charAt(0) || '?'}
                </span>
              </div>
            )}
          </div>
          <span className="text-xs font-medium text-gray-700 text-center leading-tight line-clamp-2">
            {category.nameGu || category.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
