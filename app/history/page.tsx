'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

type TxRow = {
  id: string;
  product_id: string;
  product_name: string;
  product_unit: string;
  type: 'in' | 'out';
  quantity: number;
  timestamp: number;
  note: string | null;
};

type Group = {
  shift: 'morning' | 'afternoon' | 'evening';
  rows: TxRow[];
};

const SHIFT_KEYS: Array<'morning' | 'afternoon' | 'evening'> = [
  'morning',
  'afternoon',
  'evening',
];

function shiftOf(ts: number): 'morning' | 'afternoon' | 'evening' {
  const h = new Date(ts).getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

function dayKey(ts: number): string {
  const d = new Date(ts);
  return d.toISOString().slice(0, 10);
}

export default function HistoryPage() {
  const t = useTranslations('History');
  const locale = useLocale();
  const [rows, setRows] = useState<TxRow[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [days, setDays] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/transactions?limit=500', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        setRows(d.transactions);
        const uniq = Array.from(new Set(d.transactions.map((t: TxRow) => dayKey(t.timestamp)))).sort().reverse() as string[];
        setDays(uniq);
        if (uniq.length && filter === 'all') setFilter(uniq[0]);
      });
  }, []);

  const filtered = filter === 'all' ? rows : rows.filter((r) => dayKey(r.timestamp) === filter);

  const groups: Record<string, TxRow[]> = {};
  for (const r of filtered) {
    const k = shiftOf(r.timestamp);
    (groups[k] = groups[k] || []).push(r);
  }
  const orderedGroups: Group[] = SHIFT_KEYS
    .filter((s) => groups[s]?.length)
    .map((s) => ({ shift: s, rows: groups[s] }));

  // Locale-aware date formatters (en-US vs zh-CN)
  const dateFormatter = new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timeFormatter = new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: locale === 'zh' ? false : true,
  });

  return (
    <div className="space-y-7">
      <header>
        <div className="eyebrow">{t('eyebrow')}</div>
        <h1 className="h-display mt-1">{t('title')}</h1>
        <p style={{ color: 'var(--ink-500)', marginTop: 6, fontSize: '1rem' }}>
          {t('subtitle')}
        </p>
      </header>

      {/* Day filter — pill row */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className="btn-touch"
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.95rem',
            background: filter === 'all' ? 'var(--ink-900)' : 'var(--paper-50)',
            color: filter === 'all' ? 'var(--paper-50)' : 'var(--ink-700)',
            border: '1px solid var(--paper-200)',
            minWidth: 0,
            minHeight: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {t('all')}
        </button>
        {days.map((d) => {
          const active = filter === d;
          return (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className="btn-touch"
              style={{
                padding: '0.75rem 1.25rem',
                fontSize: '0.95rem',
                background: active ? 'var(--ink-900)' : 'var(--paper-50)',
                color: active ? 'var(--paper-50)' : 'var(--ink-700)',
                border: '1px solid var(--paper-200)',
                minWidth: 0,
                minHeight: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {dateFormatter.format(new Date(d + 'T00:00:00'))}
            </button>
          );
        })}
      </div>

      {orderedGroups.length === 0 && (
        <div
          className="card text-center py-10"
          style={{ color: 'var(--ink-500)' }}
        >
          {t('noTransactions')}
        </div>
      )}

      {orderedGroups.map((g) => (
        <section key={g.shift}>
          <div
            className="flex items-center gap-3 pb-3"
            style={{ borderBottom: '1px solid var(--paper-200)' }}
          >
            <span
              className="hanko"
              aria-hidden
              style={{ width: '1.75rem', height: '1.75rem', fontSize: '0.85rem' }}
            >
              {t(`shiftShort.${g.shift}`)}
            </span>
            <span className="h-section">
              {t('shiftLabel', { shift: t(`shifts.${g.shift}`) })}
            </span>
            <span className="eyebrow" style={{ marginLeft: 'auto' }}>
              {t('entry', { count: g.rows.length })}
            </span>
          </div>

          <ul className="space-y-0" style={{ borderBottom: '1px solid var(--paper-200)' }}>
            {g.rows.map((r) => {
              const inTx = r.type === 'in';
              return (
                <li
                  key={r.id}
                  className="flex items-center gap-4 py-4"
                  style={{ borderTop: '1px solid var(--paper-200)' }}
                >
                  <span
                    className={`hanko ${inTx ? '' : 'hanko-ink'}`}
                    aria-label={inTx ? t('stockIn') : t('stockOut')}
                    style={{ width: '2.25rem', height: '2.25rem', fontSize: '1.1rem' }}
                  >
                    {inTx ? '+' : '−'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.1rem',
                        fontWeight: 500,
                        color: 'var(--ink-900)',
                      }}
                    >
                      {r.product_name.split(' (')[0]}
                    </div>
                    <div style={{ color: 'var(--ink-500)', fontSize: '0.85rem', marginTop: 2 }}>
                      {timeFormatter.format(new Date(r.timestamp))}
                      {r.note ? ` · ${r.note}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="num"
                      style={{
                        fontSize: '1.3rem',
                        fontWeight: 600,
                        color: inTx ? 'var(--jade)' : 'var(--ink-900)',
                      }}
                    >
                      {inTx ? '+' : '−'}{r.quantity.toFixed(2)}
                    </div>
                    <div className="eyebrow">{r.product_unit}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
