/**
 * Service Worker for Tractor Parts PWA
 * Provides offline support and aggressive caching for low bandwidth users
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `tractor-parts-${CACHE_VERSION}`;

// Assets to cache immediately on install
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/offline',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Static assets: Cache First
  static: {
    cacheName: `${CACHE_NAME}-static`,
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    maxEntries: 100,
  },
  // Images: Cache First with longer expiration
  images: {
    cacheName: `${CACHE_NAME}-images`,
    maxAge: 365 * 24 * 60 * 60 * 1000,
    maxEntries: 200,
  },
  // API responses: Network First with stale-while-revalidate
  api: {
    cacheName: `${CACHE_NAME}-api`,
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 50,
    networkTimeout: 3000, // 3 seconds timeout
  },
  // Pages: Stale While Revalidate
  pages: {
    cacheName: `${CACHE_NAME}-pages`,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    maxEntries: 50,
  },
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_STRATEGIES.static.cacheName).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_CACHE_URLS);
    })
  );

  // Force the waiting service worker to become active
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete old caches that don't match current version
            return cacheName.startsWith('tractor-parts-') && cacheName !== CACHE_NAME;
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );

  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    // Handle CDN images with Cache First
    if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) {
      event.respondWith(cacheFirst(request, CACHE_STRATEGIES.images));
    }
    return;
  }

  // API routes - Network First with fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, CACHE_STRATEGIES.api));
    return;
  }

  // Next.js static assets - Cache First
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/static/')) {
    event.respondWith(cacheFirst(request, CACHE_STRATEGIES.static));
    return;
  }

  // Images - Cache First
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) {
    event.respondWith(cacheFirst(request, CACHE_STRATEGIES.images));
    return;
  }

  // Pages - Stale While Revalidate
  if (request.mode === 'navigate') {
    event.respondWith(staleWhileRevalidate(request, CACHE_STRATEGIES.pages));
    return;
  }

  // Default - Network First
  event.respondWith(networkFirst(request, CACHE_STRATEGIES.pages));
});

/**
 * Cache First Strategy
 * Check cache first, if not found, fetch from network
 */
async function cacheFirst(request, options) {
  const cache = await caches.open(options.cacheName);

  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    console.log('[SW] Cache hit:', request.url);
    return cachedResponse;
  }

  // Not in cache, fetch from network
  try {
    console.log('[SW] Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);

    // Cache the response
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    // Return offline fallback if available
    const offlineResponse = await cache.match('/offline');
    if (offlineResponse) {
      return offlineResponse;
    }
    throw error;
  }
}

/**
 * Network First Strategy
 * Try network first, if fails, use cache
 */
async function networkFirst(request, options) {
  const cache = await caches.open(options.cacheName);

  try {
    // Try network first
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), options.networkTimeout || 3000)
      ),
    ]);

    // Cache the response
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    // Network failed, try cache
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // No cache available
    throw error;
  }
}

/**
 * Stale While Revalidate Strategy
 * Return cache immediately, then update in background
 */
async function staleWhileRevalidate(request, options) {
  const cache = await caches.open(options.cacheName);

  // Check cache
  const cachedResponse = await cache.match(request);

  // Fetch in background
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  // Return cached response immediately, or wait for network
  return cachedResponse || fetchPromise;
}

/**
 * Background sync for failed requests
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

/**
 * Handle push notifications
 */
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'તમારો ઓર્ડર પુષ્ટિ થયો!',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/orders',
    },
  };

  event.waitUntil(
    self.registration.showNotification('ટ્રેક્ટર પાર્ટ્સ', options)
  );
});

/**
 * Handle notification click
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});

/**
 * Sync orders when back online
 */
async function syncOrders() {
  // Get pending orders from IndexedDB
  // Send to server
  console.log('[SW] Syncing pending orders...');
}

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-cart') {
      event.waitUntil(updateCartFromServer());
    }
  });
}

async function updateCartFromServer() {
  // Sync cart with server
  console.log('[SW] Updating cart from server...');
}

console.log('[SW] Service worker registered');
