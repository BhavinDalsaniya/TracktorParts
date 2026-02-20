/**
 * Service Worker Registration Hook
 * Registers and manages the service worker for PWA functionality
 */

import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  registration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
  offline: boolean;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    registration: null,
    updateAvailable: false,
    offline: false, // Default to false, will be updated in useEffect
  });

  useEffect(() => {
    // Check if running in browser
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.log('[SW] Service Worker not supported');
      return;
    }

    const swPath = '/sw.js';

    // Register service worker
    navigator.serviceWorker
      .register(swPath)
      .then((registration) => {
        console.log('[SW] Registered successfully:', registration);

        setState({
          isSupported: true,
          isRegistered: true,
          registration,
          updateAvailable: false,
          offline: !navigator.onLine,
        });

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] New content available');
                setState((prev) => ({ ...prev, updateAvailable: true }));
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('[SW] Registration failed:', error);
        setState({
          isSupported: true,
          isRegistered: false,
          registration: null,
          updateAvailable: false,
          offline: !navigator.onLine,
        });
      });

    // Listen for online/offline events
    const handleOnline = () => setState((prev) => ({ ...prev, offline: false }));
    const handleOffline = () => setState((prev) => ({ ...prev, offline: true }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Skip waiting and activate the new service worker
   */
  const skipWaiting = () => {
    if (state.registration && state.registration.waiting) {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      // Reload to get new content
      window.location.reload();
    }
  };

  return {
    ...state,
    skipWaiting,
  };
}
