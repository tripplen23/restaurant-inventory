// Client-safe helpers — KHÔNG import db hay better-sqlite3
import type { StockLevel } from './types';

export function classifyStock(
  currentStock: number,
  threshold: number,
  daysUntilEmpty: number | null
): StockLevel {
  if (currentStock < 0) return 'critical';
  if (currentStock < threshold) return 'low';
  if (daysUntilEmpty !== null && daysUntilEmpty < 3 && currentStock > 0) return 'urgent';
  return 'ok';
}

type BadgeInfo = { label: string; kanji: string; hankoClass: string };

export function getStockBadge(level: StockLevel): BadgeInfo {
  switch (level) {
    case 'low':      return { label: 'Low',          kanji: '!',  hankoClass: '' };
    case 'urgent':   return { label: 'Urgent',       kanji: '!',  hankoClass: 'hanko-ink' };
    case 'critical': return { label: 'Data error',   kanji: '✕',  hankoClass: 'hanko-outline' };
    default:         return { label: 'OK',           kanji: '✓',  hankoClass: 'hanko-jade' };
  }
}
