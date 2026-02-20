'use client';

import { useState } from 'react';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { useCartStore } from '@/store';
import { gu } from '@/config/constants';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const [isAdding, setIsAdding] = useState(false);

  const isDisabled = !product.isActive || product.stock <= 0;

  const handleAddToCart = async () => {
    if (isDisabled || isAdding) return;

    setIsAdding(true);
    try {
      // Add quantity times
      for (let i = 0; i < quantity; i++) {
        addItem(product);
      }
      setQuantity(1);

      // Show success feedback
      if (typeof window !== 'undefined' && 'navigator' in window) {
        // Could add toast notification here
      }
    } finally {
      setIsAdding(false);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  if (isDisabled) {
    return (
      <button
        disabled
        className="btn-lg w-full bg-gray-300 text-gray-500 cursor-not-allowed"
      >
        {gu.outOfStock}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Quantity Controls */}
      <div className="flex items-center rounded-2xl border-2 border-gray-200">
        <button
          onClick={decrementQuantity}
          disabled={quantity <= 1}
          className={cn(
            'touch-target flex h-12 w-12 items-center justify-center',
            quantity <= 1 ? 'text-gray-300' : 'text-gray-700'
          )}
        >
          <Minus className="h-5 w-5" />
        </button>
        <span className="w-12 text-center text-lg font-semibold">
          {quantity}
        </span>
        <button
          onClick={incrementQuantity}
          disabled={quantity >= product.stock}
          className={cn(
            'touch-target flex h-12 w-12 items-center justify-center',
            quantity >= product.stock ? 'text-gray-300' : 'text-gray-700'
          )}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={isAdding}
        className={cn(
          'btn-xl flex-1 flex items-center justify-center gap-2',
          'bg-primary-500 text-white',
          'disabled:bg-gray-300 disabled:text-gray-500'
        )}
      >
        <ShoppingCart className="h-6 w-6" />
        {isAdding ? 'ઉમેરી રહ્યું છે...' : `${gu.addToCart} - ₹${(product.price * quantity).toLocaleString('gu-IN')}`}
      </button>
    </div>
  );
}
