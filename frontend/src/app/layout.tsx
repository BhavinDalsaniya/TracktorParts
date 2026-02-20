import type { Metadata, Viewport } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { WhatsAppProvider } from '@/components/WhatsAppProvider';
import { UpdateBanner } from '@/components/UpdateBanner';

export const metadata: Metadata = {
  title: 'ટ્રેક્ટર પાર્ટ્સ - Tractor Spare Parts',
  description: 'ટ્રેક્ટર પાર્ટ્સ - ગુજરાતનું સૌથી મોટું ટ્રેક્ટર સ્પેર પાર્ટ્સ સ્ટોર',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ટ્રેક્ટર પાર્ટ્સ',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#22c55e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="gu">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={cn('min-h-screen bg-gray-50 text-gray-900')}>
        <UpdateBanner />
        <WhatsAppProvider>
          {children}
        </WhatsAppProvider>
      </body>
    </html>
  );
}
