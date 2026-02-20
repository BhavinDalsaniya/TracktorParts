'use client';

import { useState } from 'react';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { gu, TRACTOR_BRANDS } from '@/config/constants';

export function FilterBar({ currentParams }: { currentParams: Record<string, string | undefined> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reset to page 1
    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/products');
  };

  const hasActiveFilters =
    currentParams.category || currentParams.brand || currentParams.sort;

  return (
    <>
      {/* Filter Bar */}
      <div className="sticky top-[60px] z-40 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
          {/* Sort Dropdown */}
          <select
            value={currentParams.sort || 'popular'}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="flex-shrink-0 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-base font-medium text-gray-700 focus:border-primary-500 focus:outline-none"
          >
            <option value="popular">લોકપ્રિય</option>
            <option value="newest">નવું</option>
            <option value="price_low">ઓછી કિંમત</option>
            <option value="price_high">વધુ કિંમત</option>
          </select>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(true)}
            className={cn(
              'flex-shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-base font-medium smooth-transition',
              hasActiveFilters
                ? 'bg-primary-500 text-white'
                : 'border-2 border-gray-200 bg-white text-gray-700'
            )}
          >
            <SlidersHorizontal className="h-5 w-5" />
            ફિલ્ટર
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex-shrink-0 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-base font-medium text-gray-700"
            >
              સાફ કરો
            </button>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowFilters(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{gu.filter}</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="touch-target flex h-11 w-11 items-center justify-center rounded-full bg-gray-100"
              >
                ✕
              </button>
            </div>

            {/* Brand Filter */}
            <div className="mb-6">
              <h3 className="text-base font-semibold mb-3">ટ્રેક્ટર બ્રાન્ડ</h3>
              <div className="grid grid-cols-2 gap-2">
                {TRACTOR_BRANDS.map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => {
                      updateFilter('brand', currentParams.brand === brand.id ? '' : brand.id);
                      setShowFilters(false);
                    }}
                    className={cn(
                      'rounded-xl border-2 px-4 py-3 text-base font-medium smooth-transition',
                      currentParams.brand === brand.id
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-700'
                    )}
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowFilters(false)}
              className="btn-lg w-full bg-primary-500 text-white"
            >
              બંધ કરો
            </button>
          </div>
        </div>
      )}
    </>
  );
}
