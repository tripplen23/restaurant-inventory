import type { Database } from 'better-sqlite3';

// 5 default ingredients — all measured in boxes, decimals allowed (0.25, 0.33, etc.)
const SEED_PRODUCTS = [
  { name: 'Tomato',     unit: 'box', threshold: 1 },
  { name: 'Green Salad', unit: 'box', threshold: 0.5 },
  { name: 'Broccoli',   unit: 'box', threshold: 0.5 },
  { name: 'Carrot',     unit: 'box', threshold: 1 },
  { name: 'Bell Pepper', unit: 'box', threshold: 0.5 },
];

function uuid(): string {
  // RFC4122 v4 — gọn, không cần crypto.randomUUID() cho mọi môi trường
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function seedIfEmpty(db: Database): void {
  const count = db.prepare('SELECT COUNT(*) AS c FROM products').get() as { c: number };
  if (count.c > 0) return;

  const insert = db.prepare(
    'INSERT INTO products (id, name, unit, threshold, created_at) VALUES (?, ?, ?, ?, ?)'
  );
  const now = Date.now();

  const tx = db.transaction(() => {
    for (const p of SEED_PRODUCTS) {
      insert.run(uuid(), p.name, p.unit, p.threshold, now);
    }
  });
  tx();
}
