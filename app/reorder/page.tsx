'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Product } from '@/lib/types';

export default function ReorderPage() {
  const t = useTranslations('Reorder');
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/api/products', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setProducts(d.products));
  }, []);

  const low = products
    .filter((p) => p.current_stock < p.threshold)
    .sort((a, b) => a.current_stock / a.threshold - b.current_stock / b.threshold);

  return (
    <div className="space-y-7">
      <header>
        <div className="eyebrow">{t('eyebrow')}</div>
        <h1 className="h-display mt-1">{t('title')}</h1>
        <p style={{ color: 'var(--ink-500)', marginTop: 6, fontSize: '1rem' }}>
          {t('subtitle')}
        </p>
      </header>

      {low.length === 0 ? (
        <div
          className="card flex items-center gap-4"
          style={{ borderColor: 'var(--jade)' }}
        >
          <span
            className="hanko hanko-jade hanko-lg"
            style={{ width: '3rem', height: '3rem', fontSize: '1.4rem' }}
            aria-hidden
          >
            OK
          </span>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.2rem',
                fontWeight: 500,
                color: 'var(--jade)',
              }}
            >
              {t('allAbove')}
            </div>
            <div style={{ color: 'var(--ink-500)', fontSize: '0.9rem', marginTop: 2 }}>
              {t('noRestock')}
            </div>
          </div>
        </div>
      ) : (
        <>
          <ul className="space-y-0" style={{ borderTop: '1px solid var(--paper-200)' }}>
            {low.map((p) => {
              const need = Math.max(p.threshold * 2 - p.current_stock, 1);
              const ratio = p.current_stock / p.threshold;
              const urgent = ratio < 0.5;
              return (
                <li
                  key={p.id}
                  className="py-4"
                  style={{ borderBottom: '1px solid var(--paper-200)' }}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`hanko hanko-lg ${urgent ? 'hanko-ink' : ''}`}
                      style={{ width: '3rem', height: '3rem', fontSize: '1.4rem' }}
                      aria-hidden
                    >
                      !
                    </span>
                    <div className="flex-1 min-w-0">
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '1.2rem',
                          fontWeight: 500,
                          color: 'var(--ink-900)',
                        }}
                      >
                        {p.name.split(' (')[0]}
                      </div>
                      <div style={{ color: 'var(--ink-500)', fontSize: '0.9rem', marginTop: 4 }}>
                        <span className="num" style={{ color: 'var(--cinnabar)', fontWeight: 600 }}>
                          {p.current_stock.toFixed(2)}
                        </span>
                        {' '}/{p.threshold} {p.unit}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="eyebrow">{t('order')}</div>
                      <div
                        className="num"
                        style={{
                          fontSize: '1.8rem',
                          fontWeight: 600,
                          color: 'var(--cinnabar)',
                          fontFamily: 'var(--font-mono)',
                          lineHeight: 1.1,
                        }}
                      >
                        {need.toFixed(1)}
                      </div>
                      <div className="eyebrow">{p.unit}</div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <button
            onClick={() => window.print()}
            className="btn-primary w-full no-print"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}
          >
            {t('printList')}
          </button>
        </>
      )}
    </div>
  );
}
