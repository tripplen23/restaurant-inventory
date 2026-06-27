import type { Metadata, Viewport } from 'next';
import { Inter, Shippori_Mincho, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/Nav';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const mincho = Shippori_Mincho({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-mincho',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-mono-loaded',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kitchen Stock',
  description: 'Restaurant inventory for iPad kiosk',
};

// iPad-specific viewport: no zoom, full screen
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mincho.variable} ${mono.variable}`}>
      <body>
        <Nav />
        <main className="mx-auto max-w-5xl px-5 pb-32 pt-6">{children}</main>
      </body>
    </html>
  );
}
