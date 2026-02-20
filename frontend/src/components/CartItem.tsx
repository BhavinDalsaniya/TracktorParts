'use client';

import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store';
import { formatPrice, cn } from '@/lib/utils';
import type { CartItem as CartItemType } from '@/store';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();

  const handleIncrement = () => {
    if (item.quantity < item.product.stock) {
      updateQuantity(item.product.id, item.quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.product.id, item.quantity - 1);
    }
  };

  const handleRemove = () => {
    removeItem(item.product.id);
  };

  return (
    <div className="flex gap-3 bg-white px-4 py-3">
      {/* Image */}
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
        {item.product.images?.[0] && (
          <Image
            src={item.product.images[0]}
            alt={item.product.nameGu || item.product.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
          {item.product.nameGu || item.product.name}
        </h3>

        <div className="mt-auto flex items-end justify-between">
          {/* Price */}
          <div>
            <p className="text-lg font-bold text-primary-600">
              {formatPrice(item.product.price)}
            </p>
            {item.product.compareAtPrice && item.product.compareAtPrice > item.product.price && (
              <p className="text-sm text-gray-400 line-through">
                {formatPrice(item.product.compareAtPrice)}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Quantity Controls */}
            <div className="flex items-center rounded-xl border-2 border-gray-200">
              <button
                onClick={handleDecrement}
                disabled={item.quantity <= 1}
                className={cn(
                  'touch-target flex h-9 w-9 items-center justify-center',
                  item.quantity <= 1 ? 'text-gray-300' : 'text-gray-700'
                )}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-base font-semibold">
                {item.quantity}
              </span>
              <button
                onClick={handleIncrement}
                disabled={item.quantity >= item.product.stock}
                className={cn(
                  'touch-target flex h-9 w-9 items-center justify-center',
                  item.quantity >= item.product.stock ? 'text-gray-300' : 'text-gray-700'
                )}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Remove Button */}
            <button
              onClick={handleRemove}
              className="touch-target flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 active:bg-red-100"
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
