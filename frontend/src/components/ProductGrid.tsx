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
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton h-64 rounded-2xl" />
        ))}
      </div>
    );
  }

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    addItem(product);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
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
            className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm smooth-transition active:scale-[0.98]"
          >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              {product.images?.[0] && (
                <Image
                  src={product.images[0]}
                  alt={product.nameGu}
                  fill
                  sizes="(max-width: 360px) 50vw, 180px"
                  className="object-cover"
                  loading="lazy"
                />
              )}

              {/* Badge */}
              <div className="absolute left-2 top-2 flex flex-col gap-1">
                {hasDiscount && (
                  <span className="rounded-lg bg-accent-500 px-2 py-1 text-xs font-bold text-white">
                    {discountPercentage}% {gu.off}
                  </span>
                )}
                {!product.isActive && (
                  <span className="rounded-lg bg-gray-500 px-2 py-1 text-xs font-bold text-white">
                    {gu.outOfStock}
                  </span>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-1 flex-col p-3">
              <h3 className="flex-1 text-base font-semibold text-gray-900 line-clamp-2">
                {product.nameGu || product.name}
              </h3>

              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-primary-600">
                    {formatPrice(product.price)}
                  </p>
                  {hasDiscount && (
                    <p className="text-sm text-gray-400 line-through">
                      {formatPrice(product.compareAtPrice!)}
                    </p>
                  )}
                </div>

                <button
                  onClick={(e) => handleAddToCart(e, product)}
                  disabled={!product.isActive || product.stock <= 0}
                  className={cn(
                    'flex h-11 w-11 touch-target items-center justify-center rounded-xl',
                    'active:scale-95 smooth-transition',
                    product.isActive && product.stock > 0
                      ? 'bg-primary-500 text-white active:bg-primary-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )}
                  aria-label="Add to cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                </button>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
