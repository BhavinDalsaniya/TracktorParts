'use client';

import { useServiceWorker } from '@/hooks/useServiceWorker';

/**
 * Update Banner Component
 * Shows when a new version of the app is available
 */
export function UpdateBanner() {
  const { updateAvailable, skipWaiting, offline } = useServiceWorker();

  if (offline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-yellow-500 px-4 py-2 text-center">
        <p className="text-sm font-semibold text-white">
          તમે ઓફલાઇન છો. કેટલીક સુવિધાઓ ઉપલબ્ધ નથી.
        </p>
      </div>
    );
  }

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-primary-600 px-4 py-3 shadow-lg">
      <div className="mx-auto max-w-lg flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-bold text-white">
            નવું અપડેટ ઉપલબ્ધ છે!
          </p>
          <p className="text-xs text-primary-100">
            શ્રેષ્ઠ અનુભવ માટે અપડેટ કરો
          </p>
        </div>
        <button
          onClick={skipWaiting}
          className="flex-shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-bold text-primary-600 active:scale-95 transition-transform"
        >
          અપડેટ
        </button>
      </div>
    </div>
  );
}
