/**
 * App configuration
 * Centralized configuration for the application
 */

export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'ટ્રેક્ટર પાર્ટ્સ',
    defaultLocale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'gu',
    supportedLocales: (process.env.NEXT_PUBLIC_SUPPORTED_LOCALES || 'gu,en,hi').split(','),
  },
  api: {
    url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
  },
  features: {
    enableOfflineMode: process.env.NEXT_PUBLIC_ENABLE_OFFLINE_MODE === 'true',
    enableImageLazyLoading: process.env.NEXT_PUBLIC_ENABLE_IMAGE_LAZY_LOADING !== 'false',
    enableServiceWorker: process.env.NEXT_PUBLIC_ENABLE_SERVICE_WORKER === 'true',
  },
  images: {
    quality: parseInt(process.env.NEXT_PUBLIC_IMAGE_QUALITY || '75', 10),
    format: process.env.NEXT_PUBLIC_IMAGE_FORMAT || 'webp',
    maxWidth: parseInt(process.env.NEXT_PUBLIC_MAX_IMAGE_WIDTH || '640', 10),
  },
  pagination: {
    productsPerPage: 12,
    categoriesPerPage: 20,
  },
  cache: {
    productsTTL: 5 * 60 * 1000, // 5 minutes
    categoriesTTL: 30 * 60 * 1000, // 30 minutes
  },
} as const;

export type Config = typeof config;
