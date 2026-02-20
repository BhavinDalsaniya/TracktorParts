'use client';

import { usePathname } from 'next/navigation';
import { WhatsAppButton } from '@/components/WhatsAppButton';

/**
 * Provider that conditionally renders the WhatsApp floating button
 * Hidden on auth pages and admin pages
 */
export function WhatsAppProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Pages where WhatsApp button should NOT appear
  const hideWhatsApp = [
    '/auth/login',
    '/auth/verify',
    '/admin',
  ].some((path) => pathname?.startsWith(path));

  return (
    <>
      {children}
      {!hideWhatsApp && <WhatsAppButton />}
    </>
  );
}
