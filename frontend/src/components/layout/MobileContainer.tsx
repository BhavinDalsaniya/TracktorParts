import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { BottomNav } from './BottomNav';
import { Header } from './Header';

interface MobileContainerProps {
  children: ReactNode;
  header?: {
    title?: string;
    showSearch?: boolean;
    showBack?: boolean;
    onBack?: () => void;
  };
  showNav?: boolean;
  className?: string;
}

export function MobileContainer({
  children,
  header,
  showNav = true,
  className,
}: MobileContainerProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {header && (
        <Header
          title={header.title}
          showSearch={header.showSearch}
          showBack={header.showBack}
          onBack={header.onBack}
        />
      )}

      <main
        className={cn(
          'pb-24', // Padding for bottom nav
          showNav ? 'pb-24' : 'pb-4',
          className
        )}
      >
        {children}
      </main>

      {showNav && <BottomNav />}
    </div>
  );
}
