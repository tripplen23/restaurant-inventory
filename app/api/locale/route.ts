import { NextRequest, NextResponse } from 'next/server';
import { locales, LOCALE_COOKIE } from '@/i18n/request';

export async function POST(req: NextRequest) {
  let body: { locale?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const locale = body.locale;
  if (!locale || !(locales as readonly string[]).includes(locale)) {
    return NextResponse.json(
      { error: 'Unsupported locale' },
      { status: 400 }
    );
  }
  const res = NextResponse.json({ ok: true, locale });
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  return res;
}
