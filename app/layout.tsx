import type { Metadata, Viewport } from 'next';
import { Inter, Shippori_Mincho, JetBrains_Mono, Noto_Sans_SC } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
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

// Chinese font fallback for when locale is zh
const notoSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-zh',
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const htmlLang = locale === 'zh' ? 'zh-CN' : 'en';

  return (
    <html
      lang={htmlLang}
      className={`${inter.variable} ${mincho.variable} ${mono.variable} ${notoSC.variable}`}
    >
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Nav />
          <main className="mx-auto max-w-5xl px-5 pb-32 pt-6">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
