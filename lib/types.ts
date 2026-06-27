export type Product = {
  id: string;
  name: string;
  unit: string;
  threshold: number;
  current_stock: number;
  created_at: number;
};

export type TransactionType = 'in' | 'out';

export type Transaction = {
  id: string;
  product_id: string;
  type: TransactionType;
  quantity: number;
  timestamp: number;
  note?: string;
};

export type StockLevel = 'ok' | 'low' | 'critical' | 'urgent';

export type ReportSummary = {
  product_id: string;
  product_name: string;
  unit: string;
  total_in: number;
  total_out: number;
  current_stock: number;
  daily_avg_30d: number;
  days_until_empty: number | null;
};
