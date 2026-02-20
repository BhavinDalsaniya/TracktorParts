/**
 * Performance utilities for monitoring and optimization
 */

/**
 * Measure Web Vitals
 */
export function reportWebVitals(metric: any) {
  const { name, value, id } = metric;

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${name}:`, value);
  }

  // Send to analytics (implement your analytics here)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', name, {
      event_value: Math.round(name === 'CLS' ? value * 1000 : value),
      event_label: id,
      non_interaction: true,
    });
  }
}

/**
 * Measure component render time
 */
export function measureRender(componentName: string) {
  if (typeof performance === 'undefined') return () => {};

  const start = performance.now();

  return () => {
    const end = performance.now();
    const duration = end - start;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} rendered in ${duration.toFixed(2)}ms`);
    }

    return duration;
  };
}

/**
 * Debounce for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle for performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Request animation frame throttled
 */
export function rafThrottle<T extends (...args: any[]) => any>(callback: T): T {
  let requestID: number | null = null;
  let lastArgs: Parameters<T>;

  const later = (timestamp: number) => {
    requestID = null;
    callback(...lastArgs);
  };

  return ((...args: Parameters<T>) => {
    lastArgs = args;
    if (requestID === null) {
      requestID = requestAnimationFrame(later);
    }
  }) as T;
}

/**
 * Check if element is in viewport
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Intersection Observer helper for lazy loading
 */
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') {
    console.warn('IntersectionObserver not supported');
    return null;
  }

  return new IntersectionObserver(callback, {
    rootMargin: '50px 0px', // Start loading 50px before viewport
    threshold: 0.01,
    ...options,
  });
}

/**
 * Prefetch a resource
 */
export function prefetchResource(url: string, as: 'script' | 'style' | 'image' | 'fetch' = 'fetch') {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  link.as = as;

  if (as === 'fetch') {
    link.setAttribute('crossorigin', 'anonymous');
  }

  document.head.appendChild(link);
}

/**
 * Preload a critical resource
 */
export function preloadResource(url: string, as: 'script' | 'style' | 'image' | 'font') {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = as;

  document.head.appendChild(link);
}

/**
 * DNS prefetch for external domains
 */
export function dnsPrefetch(domains: string[]) {
  if (typeof document === 'undefined') return;

  domains.forEach((domain) => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
}

/**
 * Preconnect to external domains
 */
export function preconnect(domains: string[]) {
  if (typeof document === 'undefined') return;

  domains.forEach((domain) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Measure First Contentful Paint
 */
export function measureFCP(): Promise<number> {
  return new Promise((resolve) => {
    if (typeof PerformanceObserver === 'undefined') {
      resolve(0);
      return;
    }

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');

      if (fcpEntry) {
        observer.disconnect();
        resolve(fcpEntry.startTime);
      }
    });

    observer.observe({ entryTypes: ['paint'] });

    // Fallback timeout
    setTimeout(() => {
      observer.disconnect();
      resolve(0);
    }, 10000);
  });
}

/**
 * Measure Largest Contentful Paint
 */
export function measureLCP(): Promise<number> {
  return new Promise((resolve) => {
    if (typeof PerformanceObserver === 'undefined') {
      resolve(0);
      return;
    }

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      observer.disconnect();
      resolve(lastEntry ? lastEntry.startTime : 0);
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });

    // Fallback timeout
    setTimeout(() => {
      observer.disconnect();
      resolve(0);
    }, 10000);
  });
}

/**
 * Measure Cumulative Layout Shift
 */
export function measureCLS(): Promise<number> {
  return new Promise((resolve) => {
    if (typeof PerformanceObserver === 'undefined') {
      resolve(0);
      return;
    }

    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
    });

    observer.observe({ entryTypes: ['layout-shift'] });

    // Return after delay
    setTimeout(() => {
      observer.disconnect();
      resolve(clsValue);
    }, 5000);
  });
}

/**
 * Get network information
 */
export function getNetworkInfo(): {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
} | null {
  if (typeof navigator === 'undefined' || !(navigator as any).connection) {
    return null;
  }

  const connection = (navigator as any).connection;
  return {
    effectiveType: connection.effectiveType, // '4g', '3g', '2g', 'slow-2g'
    downlink: connection.downlink, // Bandwidth in Mbps
    rtt: connection.rtt, // Round-trip time in ms
    saveData: connection.saveData, // Data saver mode
  };
}

/**
 * Check if user is on slow connection
 */
export function isSlowConnection(): boolean {
  const info = getNetworkInfo();
  if (!info) return false;

  return (
    info.effectiveType === '2g' ||
    info.effectiveType === 'slow-2g' ||
    info.saveData === true ||
    info.downlink < 1.5
  );
}

/**
 * Adaptive quality based on network
 */
export function getAdaptiveQuality(): 'low' | 'medium' | 'high' {
  const info = getNetworkInfo();
  if (!info) return 'high';

  if (info.effectiveType === 'slow-2g' || info.saveData) return 'low';
  if (info.effectiveType === '2g') return 'low';
  if (info.effectiveType === '3g') return 'medium';
  return 'high';
}

/**
 * Optimize image quality based on network
 */
export function getOptimizedImageQuality(defaultQuality: number = 75): number {
  const quality = getAdaptiveQuality();

  switch (quality) {
    case 'low':
      return 50;
    case 'medium':
      return 65;
    case 'high':
      return defaultQuality;
    default:
      return defaultQuality;
  }
}
