'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/request';

const TABS = [
  { href: '/',            key: 'stock'   as const },
  { href: '/add-product', key: 'add'     as const },
  { href: '/reorder',     key: 'reorder' as const },
  { href: '/history',     key: 'history' as const },
  { href: '/reports',     key: 'reports' as const },
];

const TOGGLE_OPTIONS: { value: Locale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'zh', label: '中' },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale() as Locale;
  const tBrand = useTranslations('Nav');
  const tTabs = useTranslations('Tabs');
  const tToggle = useTranslations('Toggle');
  const [pending, startTransition] = useTransition();
  const [switchingTo, setSwitchingTo] = useState<Locale | null>(null);

  const switchLocale = (next: Locale) => {
    if (next === locale || pending) return;
    setSwitchingTo(next);
    startTransition(async () => {
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: next }),
      });
      // Force a full reload so server components re-render with new messages
      window.location.reload();
    });
  };

  return (
    <header
      className="sticky top-0 z-20 backdrop-blur-sm"
      style={{
        background: 'rgba(250, 246, 238, 0.92)',
        borderBottom: '1px solid var(--paper-200)',
      }}
    >
      <div className="mx-auto max-w-5xl px-6 pt-5 pb-4 flex items-center gap-3">
        {/* Brand mark — hanko */}
        <div className="hanko" aria-label={tBrand('brand')}>KS</div>
        <div className="flex-1 min-w-0">
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: '1.25rem',
              lineHeight: 1.1,
              color: 'var(--ink-900)',
              letterSpacing: '-0.01em',
            }}
          >
            {tBrand('brand')}
          </div>
          <div className="eyebrow" style={{ marginTop: 3 }}>
            {tBrand('eyebrow')}
          </div>
        </div>

        {/* Locale toggle */}
        <div
          role="group"
          aria-label={tToggle('label')}
          className="flex items-center"
          style={{
            background: 'var(--paper-100)',
            border: '1px solid var(--paper-200)',
            borderRadius: 999,
            padding: 3,
            gap: 2,
          }}
        >
          {TOGGLE_OPTIONS.map((o) => {
            const active = locale === o.value;
            return (
              <button
                key={o.value}
                onClick={() => switchLocale(o.value)}
                disabled={pending}
                aria-pressed={active}
                style={{
                  minWidth: 40,
                  minHeight: 36,
                  padding: '0 12px',
                  borderRadius: 999,
                  background: active ? 'var(--cinnabar)' : 'transparent',
                  color: active ? 'var(--paper-50)' : 'var(--ink-700)',
                  fontWeight: active ? 600 : 500,
                  fontSize: '0.95rem',
                  fontFamily: o.value === 'zh' ? 'var(--font-zh), var(--font-body)' : 'var(--font-body)',
                  border: 'none',
                  cursor: pending ? 'wait' : 'pointer',
                  transition: 'background-color 180ms ease, color 180ms ease',
                  opacity: pending && switchingTo !== o.value ? 0.4 : 1,
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab bar */}
      <nav
        className="nav-tab-list mx-auto max-w-5xl px-3"
        aria-label={tTabs('primary')}
      >
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="relative flex-1 text-center transition-colors"
              style={{
                minHeight: 56,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: active ? 'var(--ink-900)' : 'var(--ink-500)',
                fontWeight: active ? 600 : 500,
                fontSize: '1.05rem',
                padding: '0 12px',
                borderRadius: 10,
                background: active ? 'var(--paper-100)' : 'transparent',
                transition: 'background-color 180ms ease, color 180ms ease',
              }}
            >
              <span>{tTabs(t.key)}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
