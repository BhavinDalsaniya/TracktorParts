import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BannerProps {
  title: string;
  subtitle?: string;
  image?: string;
  className?: string;
}

export function Banner({ title, subtitle, image, className }: BannerProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700',
        'shadow-lg shadow-primary-200',
        className
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] bg-repeat" />
      </div>

      {/* Content */}
      <div className="relative px-6 py-8 sm:px-8 sm:py-10">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-lg text-primary-100">{subtitle}</p>
        )}
      </div>

      {/* Decorative Image (optional) */}
      {image && (
        <div className="absolute right-0 bottom-0 h-32 w-32 opacity-20 sm:h-48 sm:w-48">
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 640px) 128px, 192px"
            className="object-cover"
            priority
          />
        </div>
      )}
    </div>
  );
}
