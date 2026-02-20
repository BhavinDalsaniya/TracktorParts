/**
 * Dynamic imports for code splitting
 * Lazy load components to reduce initial bundle size
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Loading component for lazy loaded components
export function LoadingFallback() {
  return (
    <div className="flex h-32 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-500 border-t-transparent" />
    </div>
  );
}

// Loading skeleton for better UX
export function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      <div className="h-4 rounded bg-gray-200" />
      <div className="h-4 rounded bg-gray-200 w-3/4" />
      <div className="h-4 rounded bg-gray-200 w-1/2" />
    </div>
  );
}

/**
 * Lazy load Admin Components
 */
export const AdminDashboard = dynamic(
  () => import('@/app/admin/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <LoadingFallback />,
    ssr: true,
  }
);

export const AdminProducts = dynamic(
  () => import('@/app/admin/products/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <SkeletonLoader />,
    ssr: true,
  }
);

export const AdminOrders = dynamic(
  () => import('@/app/admin/orders/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <SkeletonLoader />,
    ssr: true,
  }
);

/**
 * Lazy load Heavy Components
 */
export const ProductImageGallery = dynamic(
  () => import('@/components/ProductImageGallery'),
  {
    loading: () => (
      <div className="aspect-square animate-pulse bg-gray-200 rounded-2xl" />
    ),
    ssr: true,
  }
);

export const FilterBar = dynamic(
  () => import('@/components/FilterBar'),
  {
    loading: () => (
      <div className="h-14 animate-pulse bg-gray-200 rounded-xl" />
    ),
    ssr: true,
  }
);

/**
 * Lazy load Modal/Dialog Components
 */
export const AuthModal = dynamic(
  () => import('@/components/modals/AuthModal'),
  {
    loading: () => null,
    ssr: false,
  }
);

export const CartDrawer = dynamic(
  () => import('@/components/modals/CartDrawer'),
  {
    loading: () => null,
    ssr: false,
  }
);

/**
 * Lazy load Admin Forms
 */
export const ProductForm = dynamic(
  () => import('@/components/admin/ProductForm'),
  {
    loading: () => <SkeletonLoader />,
    ssr: true,
  }
);

/**
 * Create a lazy loaded component with custom loading
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    loading?: ComponentType;
    ssr?: boolean;
  }
) {
  return dynamic(importFn, {
    loading: options?.loading || LoadingFallback,
    ssr: options?.ssr ?? true,
  });
}

/**
 * Prefetch a component for faster navigation
 */
export function prefetchComponent(route: string) {
  if (typeof window !== 'undefined') {
    // Next.js automatically prefetches on hover
    // This can be used for critical routes
    import(`@/app${route}/page`);
  }
}
