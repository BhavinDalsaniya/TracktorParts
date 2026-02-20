/**
 * Cart store using Zustand
 * Manages shopping cart state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isOpen: boolean;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  closeCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      itemCount: 0,
      subtotal: 0,
      isOpen: false,

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product.id === product.id
          );

          let newItems: CartItem[];

          if (existingItem) {
            newItems = state.items.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            newItems = [...state.items, { product, quantity }];
          }

          const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
          const subtotal = newItems.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
          );

          return { items: newItems, itemCount, subtotal, isOpen: true };
        });
      },

      removeItem: (productId) => {
        set((state) => {
          const newItems = state.items.filter(
            (item) => item.product.id !== productId
          );
          const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
          const subtotal = newItems.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
          );

          return { items: newItems, itemCount, subtotal };
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => {
          const newItems = state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          );
          const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
          const subtotal = newItems.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
          );

          return { items: newItems, itemCount, subtotal };
        });
      },

      clearCart: () => {
        set({ items: [], itemCount: 0, subtotal: 0 });
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      closeCart: () => {
        set({ isOpen: false });
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        itemCount: state.itemCount,
        subtotal: state.subtotal,
      }),
    }
  )
);
