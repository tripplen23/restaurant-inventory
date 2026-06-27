import type { Client } from '@libsql/client';

const SEED_PRODUCTS = [
  { name: 'Tomato',     unit: 'box', threshold: 1 },
  { name: 'Green Salad', unit: 'box', threshold: 0.5 },
  { name: 'Broccoli',   unit: 'box', threshold: 0.5 },
  { name: 'Carrot',     unit: 'box', threshold: 1 },
  { name: 'Bell Pepper', unit: 'box', threshold: 0.5 },
];

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function seedIfEmpty(client: Client): Promise<void> {
  const r = await client.execute('SELECT COUNT(*) AS c FROM products');
  const count = Number((r.rows[0]?.c as number | bigint) ?? 0);
  if (count > 0) return;

  const now = Date.now();
  for (const p of SEED_PRODUCTS) {
    await client.execute({
      sql: 'INSERT INTO products (id, name, unit, threshold, created_at) VALUES (?, ?, ?, ?, ?)',
      args: [uuid(), p.name, p.unit, p.threshold, now],
    });
  }
}
