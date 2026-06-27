'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ReportSummary } from '@/lib/types';

function Sparkline({ values, max }: { values: number[]; max: number }) {
  const t = useTranslations('Reports');
  const w = 320, h = 60;
  if (!values.length || max === 0) {
    return (
      <div
        className="flex items-center"
        style={{ height: 60, color: 'var(--ink-500)', fontSize: '0.85rem' }}
      >
        {t('noData')}
      </div>
    );
  }
  const step = w / Math.max(values.length - 1, 1);
  const points = values
    .map((v, i) => `${i * step},${h - (v / max) * (h - 8) - 4}`)
    .join(' ');

  return (
    <svg width={w} height={h} style={{ overflow: 'visible', display: 'block', width: '100%' }} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {/* Faint area under the line */}
      <polyline
        points={`0,${h} ${points} ${w},${h}`}
        fill="rgba(74, 107, 74, 0.08)"
        stroke="none"
      />
      <polyline
        points={points}
        fill="none"
        stroke="var(--ink-900)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {values.map((v, i) => (
        v > 0 ? (
          <circle
            key={i}
            cx={i * step}
            cy={h - (v / max) * (h - 8) - 4}
            r="3"
            fill="var(--cinnabar)"
          />
        ) : null
      ))}
    </svg>
  );
}

export default function ReportsPage() {
  const t = useTranslations('Reports');
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [daily, setDaily] = useState<Record<string, number[]>>({});

  useEffect(() => {
    fetch('/api/reports', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setReports(d.reports));

    // Last 14 days
    const from = Date.now() - 14 * 24 * 60 * 60 * 1000;
    fetch(`/api/transactions?from=${from}&limit=2000`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        const buckets: Record<string, Record<string, number>> = {};
        for (let i = 13; i >= 0; i--) {
          const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
          for (const r of d.transactions as { product_id: string; type: string; quantity: number; timestamp: number }[]) {
            const k = dayKey(r.timestamp);
            if (k !== day) continue;
            buckets[r.product_id] = buckets[r.product_id] || {};
            buckets[r.product_id][k] = (buckets[r.product_id][k] || 0) + (r.type === 'out' ? r.quantity : 0);
          }
        }
        const series: Record<string, number[]> = {};
        for (const pid of Object.keys(buckets)) {
          series[pid] = [];
          for (let i = 13; i >= 0; i--) {
            const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
            series[pid].push(buckets[pid][day] || 0);
          }
        }
        setDaily(series);
      });
  }, []);

  function dayKey(ts: number) {
    return new Date(ts).toISOString().slice(0, 10);
  }

  return (
    <div className="space-y-7">
      <header>
        <div className="eyebrow">{t('eyebrow')}</div>
        <h1 className="h-display mt-1">{t('title')}</h1>
        <p style={{ color: 'var(--ink-500)', marginTop: 6, fontSize: '1rem' }}>
          {t('subtitle')}
        </p>
      </header>

      {reports.length === 0 && (
        <div style={{ color: 'var(--ink-500)' }}>{t('loading')}</div>
      )}

      {reports.map((r) => {
        const series = daily[r.product_id] || [];
        const max = Math.max(...series, 0.1);
        const willRunOut = r.days_until_empty !== null && r.days_until_empty < 999;
        return (
          <article
            key={r.product_id}
            className="card"
            style={{ padding: '1.5rem 1.25rem' }}
          >
            <header className="flex items-baseline justify-between gap-3 mb-4">
              <div>
                <h2 className="h-section">{r.product_name.split(' (')[0]}</h2>
                <div className="eyebrow mt-1">{r.unit}</div>
              </div>
              {willRunOut && r.days_until_empty! < 1 && (
                <span
                  className="hanko hanko-ink"
                  aria-label={t('runOutAria')}
                  style={{ width: '2rem', height: '2rem', fontSize: '1rem' }}
                >
                  {t('urg')}
                </span>
              )}
            </header>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="eyebrow">{t('in')}</div>
                <div
                  className="num"
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 600,
                    color: 'var(--jade)',
                    marginTop: 2,
                  }}
                >
                  +{r.total_in.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="eyebrow">{t('out')}</div>
                <div
                  className="num"
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 600,
                    color: 'var(--ink-900)',
                    marginTop: 2,
                  }}
                >
                  −{r.total_out.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="eyebrow">{t('onHand')}</div>
                <div
                  className="num"
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 600,
                    color: 'var(--cinnabar)',
                    marginTop: 2,
                  }}
                >
                  {r.current_stock.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--paper-200)' }}>
              <div className="flex justify-between mb-3">
                <span className="eyebrow">{t('last14Out')}</span>
                <span style={{ color: 'var(--ink-700)', fontSize: '0.9rem' }}>
                  {t('dailyAvg')}{' '}
                  <span className="num" style={{ fontWeight: 600, color: 'var(--ink-900)' }}>
                    {r.daily_avg_30d.toFixed(2)}
                  </span>
                </span>
              </div>
              <Sparkline values={series} max={max} />
              {willRunOut && (
                <p
                  style={{
                    marginTop: 10,
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: r.days_until_empty! < 3 ? 'var(--cinnabar)' : 'var(--ink-700)',
                  }}
                >
                  {r.days_until_empty! < 1
                    ? t('runOutToday')
                    : t('daysLeft', { days: r.days_until_empty!.toFixed(1) })}
                </p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
