'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store';
import { gu } from '@/config/constants';
import type { Product } from '@/types';

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const addItem = useCartStore((state) => state.addItem);

  if (products.length === 0) {
    return (
      <div className="grid grid-cols-4 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="skeleton h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    addItem(product);
  };

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {products.map((product) => {
        const priceNum = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
        const compareAtPriceNum = product.compareAtPrice
          ? (typeof product.compareAtPrice === 'string' ? parseFloat(product.compareAtPrice) : product.compareAtPrice)
          : null;

        const hasDiscount = compareAtPriceNum && compareAtPriceNum > priceNum;
        const discountPercentage = hasDiscount
          ? Math.round(
              ((compareAtPriceNum! - priceNum) / compareAtPriceNum!) * 100
            )
          : 0;

        return (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-sm smooth-transition active:scale-[0.98]"
          >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              {product.images?.[0] && (
                <Image
                  src={product.images[0]}
                  alt={product.nameGu}
                  fill
                  sizes="(max-width: 360px) 25vw, 90px"
                  className="object-cover"
                  loading="lazy"
                />
              )}

              {/* Badge */}
              {hasDiscount && (
                <span className="absolute left-0.5 top-0.5 rounded bg-accent-500 px-0.5 py-0.5 text-[8px] font-bold text-white">
                  {discountPercentage}%
                </span>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-1 flex-col p-1">
              <h3 className="flex-1 text-[10px] font-medium text-gray-900 line-clamp-1 leading-tight">
                {product.nameGu || product.name}
              </h3>

              <div className="mt-0.5 flex items-center justify-between gap-0.5">
                <p className="text-[10px] font-bold text-primary-600">
                  {formatPrice(product.price)}
                </p>

                <button
                  onClick={(e) => handleAddToCart(e, product)}
                  disabled={product.isActive === false || product.stock <= 0}
                  className={cn(
                    'flex h-5 w-5 touch-target items-center justify-center',
                    'active:scale-95 smooth-transition',
                    product.isActive !== false && product.stock > 0
                      ? 'bg-primary-500 text-white active:bg-primary-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )}
                  aria-label="Add to cart"
                >
                  <ShoppingCart className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
