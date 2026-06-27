import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import type { Transaction, TransactionType } from '@/lib/types';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type ListQuery = {
  productId?: string;
  from?: string; // ISO
  to?: string;
  limit?: string;
};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q: ListQuery = {
    productId: sp.get('productId') ?? undefined,
    from: sp.get('from') ?? undefined,
    to: sp.get('to') ?? undefined,
    limit: sp.get('limit') ?? undefined,
  };

  const where: string[] = [];
  const params: (string | number)[] = [];
  if (q.productId) { where.push('t.product_id = ?'); params.push(q.productId); }
  if (q.from)      { where.push('t.timestamp >= ?'); params.push(Number(q.from)); }
  if (q.to)        { where.push('t.timestamp <= ?'); params.push(Number(q.to)); }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const limit = Math.min(Number(q.limit) || 500, 2000);

  const rows = db
    .prepare(
      `SELECT t.*, p.name AS product_name, p.unit AS product_unit
       FROM transactions t
       JOIN products p ON p.id = t.product_id
       ${whereSql}
       ORDER BY t.timestamp DESC
       LIMIT ?`
    )
    .all(...params, limit);
  return NextResponse.json({ transactions: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Body không hợp lệ' }, { status: 400 });

  const productId = String(body.product_id ?? '');
  const type = String(body.type ?? '') as TransactionType;
  const quantity = Number(body.quantity);
  if (!productId) return NextResponse.json({ error: 'product_id required' }, { status: 400 });
  if (type !== 'in' && type !== 'out')
    return NextResponse.json({ error: "type must be 'in' or 'out'" }, { status: 400 });
  if (!Number.isFinite(quantity) || quantity <= 0)
    return NextResponse.json({ error: 'quantity must be > 0' }, { status: 400 });

  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const id = uuid();
  const timestamp = Number(body.timestamp) || Date.now();
  const note = typeof body.note === 'string' ? body.note : null;

  db.prepare(
    'INSERT INTO transactions (id, product_id, type, quantity, timestamp, note) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, productId, type, quantity, timestamp, note);

  const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as Transaction;
  return NextResponse.json({ transaction: tx }, { status: 201 });
}
