import { db } from './db';
import type { ReportSummary, StockLevel } from '../types';

// Tính mức cảnh báo dựa trên threshold + days_until_empty
export function classifyStock(
  currentStock: number,
  threshold: number,
  daysUntilEmpty: number | null
): StockLevel {
  if (currentStock < 0) return 'critical'; // data lỗi
  if (currentStock < threshold) return 'low';
  if (daysUntilEmpty !== null && daysUntilEmpty < 3 && currentStock > 0) return 'urgent';
  if (currentStock < threshold * 2) return 'ok';
  return 'ok';
}

export function getStockBadge(level: StockLevel): { label: string; color: string; emoji: string } {
  switch (level) {
    case 'low':     return { label: 'Sắp hết',    color: 'bg-red-500',    emoji: '🔴' };
    case 'urgent':  return { label: 'Cấp bách',   color: 'bg-red-700',    emoji: '⚫' };
    case 'critical':return { label: 'Lỗi dữ liệu',color: 'bg-gray-700',  emoji: '❌' };
    default:        return { label: 'Bình thường', color: 'bg-green-500',  emoji: '🟢' };
  }
}

export function getDailyAvg(productId: string, days = 30): number {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(quantity), 0) AS total
       FROM transactions
       WHERE product_id = ? AND type = 'out' AND timestamp >= ?`
    )
    .get(productId, since) as { total: number };
  return row.total / days;
}

export function buildReport(productId: string): ReportSummary | null {
  const product = db
    .prepare('SELECT * FROM v_product_stock WHERE id = ?')
    .get(productId) as
    | { id: string; name: string; unit: string; threshold: number; current_stock: number }
    | undefined;
  if (!product) return null;

  const totals = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'in'  THEN quantity ELSE 0 END), 0) AS total_in,
         COALESCE(SUM(CASE WHEN type = 'out' THEN quantity ELSE 0 END), 0) AS total_out
       FROM transactions WHERE product_id = ?`
    )
    .get(productId) as { total_in: number; total_out: number };

  const dailyAvg = getDailyAvg(productId, 30);
  const daysUntilEmpty = dailyAvg > 0 ? product.current_stock / dailyAvg : null;

  return {
    product_id: product.id,
    product_name: product.name,
    unit: product.unit,
    total_in: totals.total_in,
    total_out: totals.total_out,
    current_stock: product.current_stock,
    daily_avg_30d: dailyAvg,
    days_until_empty: daysUntilEmpty,
  };
}

export function buildAllReports(): ReportSummary[] {
  const products = db.prepare('SELECT id FROM v_product_stock').all() as { id: string }[];
  return products
    .map((p) => buildReport(p.id))
    .filter((r): r is ReportSummary => r !== null);
}
