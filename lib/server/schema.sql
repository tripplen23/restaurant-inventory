-- Schema for restaurant inventory (SQLite / libSQL compatible)
-- This file is run automatically on first DB connect.

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL,
  threshold REAL NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  quantity REAL NOT NULL,
  timestamp INTEGER NOT NULL,
  note TEXT,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tx_product_time
  ON transactions(product_id, timestamp);

-- View: current stock = sum(in) - sum(out) per product
DROP VIEW IF EXISTS v_product_stock;
CREATE VIEW v_product_stock AS
  SELECT
    p.id,
    p.name,
    p.unit,
    p.threshold,
    p.created_at,
    COALESCE(SUM(CASE WHEN t.type = 'in'  THEN t.quantity ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0)
      AS current_stock
  FROM products p
  LEFT JOIN transactions t ON t.product_id = p.id
  GROUP BY p.id;
