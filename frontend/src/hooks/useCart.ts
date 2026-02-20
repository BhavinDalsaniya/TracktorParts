/**
 * Cart store using Zustand
 * Lightweight state management for shopping cart
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Cart, CartItem, Product } from '@/types';
import { storage } from '@/lib/utils';

interface CartStore extends Cart {
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isLoading: boolean;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      total: 0,
      isLoading: false,

      addItem: (product: Product, quantity = 1) => {
        set({ isLoading: true });
        try {
          const items = get().items;
          const existingItem = items.find((item) => item.productId === product.id);

          let newItems: CartItem[];
          if (existingItem) {
            newItems = items.map((item) =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            newItems = [...items, { productId: product.id, product, quantity }];
          }

          const subtotal = newItems.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
          );

          set({ items: newItems, subtotal, total: subtotal, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          console.error('Error adding item to cart:', error);
        }
      },

      removeItem: (productId: string) => {
        set({ isLoading: true });
        try {
          const items = get().items.filter((item) => item.productId !== productId);
          const subtotal = items.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
          );
          set({ items, subtotal, total: subtotal, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          console.error('Error removing item from cart:', error);
        }
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set({ isLoading: true });
        try {
          const items = get().items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          );
          const subtotal = items.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
          );
          set({ items, subtotal, total: subtotal, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          console.error('Error updating cart quantity:', error);
        }
      },

      clearCart: () => {
        set({ items: [], subtotal: 0, total: 0, isLoading: false });
      },
    }),
    {
      name: 'cart-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);
