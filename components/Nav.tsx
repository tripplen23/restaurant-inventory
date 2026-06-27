'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/',            label: 'Stock' },
  { href: '/add-product', label: 'Add' },
  { href: '/reorder',     label: 'Reorder' },
  { href: '/history',     label: 'History' },
  { href: '/reports',     label: 'Reports' },
];

export function Nav() {
  const pathname = usePathname();
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
        <div className="hanko" aria-label="Kitchen Stock">KS</div>
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
            Kitchen Stock
          </div>
          <div
            className="eyebrow"
            style={{ marginTop: 3 }}
          >
            Restaurant inventory
          </div>
        </div>
      </div>

      {/* Tab bar — fixed 5 tabs, no horizontal scroll, big touch targets */}
      <nav
        className="mx-auto max-w-5xl px-3 flex gap-1.5"
        aria-label="Primary"
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
                transition:
                  'background-color 180ms ease, color 180ms ease',
              }}
            >
              <span>{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
