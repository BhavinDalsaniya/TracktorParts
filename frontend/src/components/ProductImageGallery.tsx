'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductImageGalleryProps {
  images: string[];
  name: string;
}

export function ProductImageGallery({ images, name }: ProductImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayImages = images?.length > 0 ? images : ['/placeholder.jpg'];

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  return (
    <div className="relative aspect-square bg-gray-100">
      {/* Main Image */}
      <div className="relative h-full w-full">
        <Image
          src={displayImages[currentIndex]}
          alt={name}
          fill
          sizes="(max-width: 360px) 100vw, 360px"
          className="object-cover"
          priority
        />

        {/* Navigation Arrows - only show if multiple images */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 touch-target flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg active:bg-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 touch-target flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg active:bg-white"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1.5">
            <span className="text-sm font-semibold text-white">
              {currentIndex + 1} / {displayImages.length}
            </span>
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {displayImages.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 flex gap-2 p-3">
          {displayImages.map((img, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border-2',
                index === currentIndex
                  ? 'border-primary-500 ring-2 ring-primary-200'
                  : 'border-white/50'
              )}
            >
              <Image
                src={img}
                alt={`${name} ${index + 1}`}
                fill
                sizes="56px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
