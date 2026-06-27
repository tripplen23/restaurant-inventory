'use client';

import type { StockLevel } from '@/lib/types';
import { getStockBadge } from '@/lib/client-helpers';

export function StockBadge({ level, stock, threshold }: {
  level: StockLevel;
  stock: number;
  threshold: number;
}) {
  const { label, kanji, hankoClass } = getStockBadge(level);
  return (
    <div className="flex items-center gap-2">
      <span
        className={`hanko ${hankoClass}`}
        style={{ width: '1.6rem', height: '1.6rem', fontSize: '0.8rem' }}
        aria-label={label}
      >
        {kanji}
      </span>
      <span style={{ fontSize: '0.85rem', color: 'var(--ink-700)', fontWeight: 500 }}>
        {label}
      </span>
      <span className="num" style={{ fontSize: '0.75rem', color: 'var(--ink-500)' }}>
        {stock.toFixed(2)} / {threshold}
      </span>
    </div>
  );
}
