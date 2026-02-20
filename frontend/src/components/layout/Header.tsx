'use client';

import Link from 'next/link';
import { Search, ShoppingCart, User } from 'lucide-react';
import { useCartStore } from '@/store';
import { gu } from '@/config/constants';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  showBack?: boolean;
  onBack?: () => void;
}

export function Header({
  title = gu.appName,
  showSearch = true,
  showBack = false,
  onBack,
}: HeaderProps) {
  const router = useRouter();
  const itemCount = useCartStore((state) => state.itemCount);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Back button or Logo */}
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={handleBack}
              className="touch-target flex items-center justify-center rounded-full bg-gray-100 p-2 active:bg-gray-200"
              aria-label={gu.back}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          ) : (
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500">
                <span className="text-lg font-bold text-white">ટ્રે</span>
              </div>
              <span className="text-xl font-bold text-primary-600 hidden sm:block">
                {title}
              </span>
            </Link>
          )}
        </div>

        {/* Title (centered on mobile) */}
        {showBack && (
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Search button */}
          {showSearch && !showBack && (
            <Link
              href="/search"
              className="touch-target flex items-center justify-center rounded-full bg-gray-100 p-2 active:bg-gray-200"
              aria-label={gu.search}
            >
              <Search className="h-6 w-6 text-gray-700" />
            </Link>
          )}

          {/* Cart button */}
          <Link
            href="/cart"
            className="relative touch-target flex items-center justify-center rounded-full bg-primary-500 p-2 active:bg-primary-600"
            aria-label={gu.cart}
          >
            <ShoppingCart className="h-6 w-6 text-white" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          {/* User button */}
          {!showBack && (
            <Link
              href="/account"
              className="touch-target flex items-center justify-center rounded-full bg-gray-100 p-2 active:bg-gray-200 sm:hidden"
              aria-label={gu.account}
            >
              <User className="h-6 w-6 text-gray-700" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
