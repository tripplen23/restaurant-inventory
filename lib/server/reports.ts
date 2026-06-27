import { dbAll, dbFirst } from './db';
import type { ReportSummary, StockLevel } from '../types';

export function classifyStock(
  currentStock: number,
  threshold: number,
  daysUntilEmpty: number | null
): StockLevel {
  if (currentStock < 0) return 'critical';
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

export async function getDailyAvg(productId: string, days = 30): Promise<number> {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const row = await dbFirst<{ total: number }>(
    `SELECT COALESCE(SUM(quantity), 0) AS total
     FROM transactions
     WHERE product_id = ? AND type = 'out' AND timestamp >= ?`,
    [productId, since]
  );
  return (row?.total ?? 0) / days;
}

export async function buildReport(productId: string): Promise<ReportSummary | null> {
  const product = await dbFirst<{
    id: string; name: string; unit: string; threshold: number; current_stock: number;
  }>('SELECT * FROM v_product_stock WHERE id = ?', [productId]);
  if (!product) return null;

  const totals = await dbFirst<{ total_in: number; total_out: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'in'  THEN quantity ELSE 0 END), 0) AS total_in,
       COALESCE(SUM(CASE WHEN type = 'out' THEN quantity ELSE 0 END), 0) AS total_out
     FROM transactions WHERE product_id = ?`,
    [productId]
  );

  const dailyAvg = await getDailyAvg(productId, 30);
  const daysUntilEmpty = dailyAvg > 0 ? product.current_stock / dailyAvg : null;

  return {
    product_id: product.id,
    product_name: product.name,
    unit: product.unit,
    total_in: totals?.total_in ?? 0,
    total_out: totals?.total_out ?? 0,
    current_stock: product.current_stock,
    daily_avg_30d: dailyAvg,
    days_until_empty: daysUntilEmpty,
  };
}

export async function buildAllReports(): Promise<ReportSummary[]> {
  const products = await dbAll<{ id: string }>('SELECT id FROM v_product_stock');
  const results = await Promise.all(products.map((p) => buildReport(p.id)));
  return results.filter((r): r is ReportSummary => r !== null);
}
