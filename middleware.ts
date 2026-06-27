import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, LOCALE_COOKIE } from './i18n/request';

// Cookie-based locale: no URL prefix rewriting.
// We only handle the API to set/clear the cookie so the Nav toggle can hit it.
function isLocale(value: string): boolean {
  return (locales as readonly string[]).includes(value);
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 1) POST /api/locale  → set cookie
  if (req.method === 'POST' && pathname === '/api/locale') {
    // The actual cookie write happens in the route handler so the body
    // can be parsed. Middleware just lets it through.
    return NextResponse.next();
  }

  // 2) GET /  with ?lang=zh  → set cookie then redirect to clean URL
  if (req.method === 'GET' && pathname === '/' && search) {
    const next = req.nextUrl.searchParams.get('lang');
    if (next && isLocale(next)) {
      const url = req.nextUrl.clone();
      url.searchParams.delete('lang');
      const res = NextResponse.redirect(url);
      res.cookies.set(LOCALE_COOKIE, next, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      });
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/api/locale'],
};
