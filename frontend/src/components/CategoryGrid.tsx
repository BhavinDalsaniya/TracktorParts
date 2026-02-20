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
              'flex h-16 w-16 items-center justify-center rounded-2xl',
              'bg-gradient-to-br from-primary-400 to-primary-600',
              'shadow-sm shadow-primary-200'
            )}
          >
            {category.image ? (
              <Image
                src={category.image}
                alt={category.nameGu}
                width={48}
                height={48}
                className="h-12 w-12 rounded-xl object-cover"
              />
            ) : (
              <span className="text-2xl">
                {category.nameGu?.charAt(0) || category.name?.charAt(0) || '?'}
              </span>
            )}
          </div>
          <span className="text-xs font-medium text-gray-700 text-center leading-tight">
            {category.nameGu || category.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
