'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { getOptimizedImageQuality, createIntersectionObserver } from '@/lib/performance';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  quality?: number;
}

/**
 * Optimized Image Component with:
 * - Lazy loading
 * - Adaptive quality based on network
 * - Blur placeholder
 * - Intersection Observer
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes = '(max-width: 360px) 100vw, (max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  placeholder = 'blur',
  quality: qualityProp,
}: OptimizedImageProps) {
  const [isInView, setIsInView] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Get adaptive quality based on network
  const quality = qualityProp ?? getOptimizedImageQuality(75);

  // Set up Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = createIntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            if (observer) observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );

    if (observer && imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, [priority, isInView]);

  // Blur placeholder (data URI)
  const blurDataURL =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Cfilter id="b"%3E%3CfeGaussianBlur in="SourceGraphic" stdDeviation="40"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" fill="%23f3f4f6"/%3E%3C/svg%3E';

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className || ''}`}
      style={fill ? undefined : { width, height }}
    >
      {/* Loading placeholder */}
      {placeholder === 'blur' && !isLoaded && (
        <div
          className="absolute inset-0 animate-pulse bg-gray-200"
          style={{
            backgroundImage: `url(${blurDataURL})`,
            backgroundSize: 'cover',
          }}
        />
      )}

      {/* Actual image */}
      {isInView && (
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          sizes={sizes}
          quality={quality}
          priority={priority}
          placeholder={placeholder === 'blur' ? 'blur' : undefined}
          blurDataURL={placeholder === 'blur' ? blurDataURL : undefined}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </div>
  );
}

/**
 * Product Thumbnail - Small, optimized images for listings
 */
export function ProductThumbnail({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={180}
      height={180}
      className={className}
      sizes="(max-width: 360px) 50vw, 180px"
      quality={65}
    />
  );
}

/**
 * Product Gallery Image - High quality for detail view
 */
export function ProductGalleryImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={800}
      height={800}
      fill
      className={className}
      sizes="(max-width: 360px) 100vw, (max-width: 640px) 100vw, 800px"
      quality={80}
      priority
    />
  );
}

/**
 * Category Banner Image - Wide banners
 */
export function CategoryBanner({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={1200}
      height={400}
      className={className}
      sizes="100vw"
      quality={70}
    />
  );
}
