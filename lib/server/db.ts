import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { seedIfEmpty } from './seed';

// DB file nằm cạnh project root, tránh bị Next.js xoá khi build
const DB_DIR = path.join(process.cwd(), '.data');
const DB_PATH = path.join(DB_DIR, 'inventory.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Singleton pattern: Next.js dev mode hot-reload, tránh tạo nhiều connection
declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

function getDb(): Database.Database {
  if (global.__db) return global.__db;

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
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
  `);

  // View tính tồn kho current (sum in - sum out)
  db.exec(`
    CREATE VIEW IF NOT EXISTS v_product_stock AS
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
  `);

  seedIfEmpty(db);
  global.__db = db;
  return db;
}

export const db = getDb();
