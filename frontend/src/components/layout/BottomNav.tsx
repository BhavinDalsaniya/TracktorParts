'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Grid2x2,
  ShoppingCart,
  Receipt,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { gu } from '@/config/constants';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/', icon: Home, label: gu.home },
  { href: '/categories', icon: Grid2x2, label: gu.categories },
  { href: '/cart', icon: ShoppingCart, label: gu.cart },
  { href: '/orders', icon: Receipt, label: gu.orders },
  { href: '/account', icon: User, label: gu.account },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide on certain pages
  const hideNav = ['/auth/login', '/auth/verify', '/checkout', '/admin'].some(
    (path) => pathname?.startsWith(path)
  );

  if (hideNav) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 min-w-[60px] touch-target smooth-transition',
                isActive
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-500 active:text-gray-700'
              )}
            >
              <Icon className={cn('h-6 w-6', isActive && 'stroke-[2.5]')} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
