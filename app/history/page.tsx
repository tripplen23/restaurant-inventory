'use client';

import { useEffect, useState } from 'react';

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
  label: string;
  rows: TxRow[];
};

function shiftOf(ts: number): 'Morning' | 'Afternoon' | 'Evening' {
  const h = new Date(ts).getHours();
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
}

function dayKey(ts: number): string {
  const d = new Date(ts);
  return d.toISOString().slice(0, 10);
}

function formatDay(d: string): string {
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function HistoryPage() {
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
  const orderedGroups: Group[] = (['Morning', 'Afternoon', 'Evening'] as const)
    .filter((s) => groups[s]?.length)
    .map((s) => ({ label: s, rows: groups[s] }));

  return (
    <div className="space-y-7">
      <header>
        <div className="eyebrow">Transaction log</div>
        <h1 className="h-display mt-1">History</h1>
        <p style={{ color: 'var(--ink-500)', marginTop: 6, fontSize: '1rem' }}>
          Recent movements, grouped by day and shift.
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
          All
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
              {formatDay(d)}
            </button>
          );
        })}
      </div>

      {orderedGroups.length === 0 && (
        <div
          className="card text-center py-10"
          style={{ color: 'var(--ink-500)' }}
        >
          No transactions yet.
        </div>
      )}

      {orderedGroups.map((g) => (
        <section key={g.label}>
          <div
            className="flex items-center gap-3 pb-3"
            style={{ borderBottom: '1px solid var(--paper-200)' }}
          >
            <span
              className="hanko"
              aria-hidden
              style={{ width: '1.75rem', height: '1.75rem', fontSize: '0.85rem' }}
            >
              {g.label === 'Morning' ? 'AM' : g.label === 'Afternoon' ? 'PM' : 'EVE'}
            </span>
            <span className="h-section">{g.label} shift</span>
            <span className="eyebrow" style={{ marginLeft: 'auto' }}>
              {g.rows.length} {g.rows.length === 1 ? 'entry' : 'entries'}
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
                    aria-label={inTx ? 'Stock in' : 'Stock out'}
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
                      {new Date(r.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
