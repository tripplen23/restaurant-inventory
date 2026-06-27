import { NextRequest, NextResponse } from 'next/server';
import { dbAll, dbFirst, dbRun } from '@/lib/server/db';
import type { Product } from '@/lib/types';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function GET() {
  const rows = await dbAll<Product>('SELECT * FROM v_product_stock ORDER BY name');
  return NextResponse.json({ products: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== 'string' || !body.name.trim()) {
    return NextResponse.json({ error: 'Product name required' }, { status: 400 });
  }
  const unit = typeof body.unit === 'string' && body.unit.trim() ? body.unit : 'box';
  const threshold = Number.isFinite(body.threshold) && body.threshold >= 0 ? body.threshold : 1;

  const id = uuid();
  try {
    await dbRun(
      'INSERT INTO products (id, name, unit, threshold, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, body.name.trim(), unit, threshold, Date.now()]
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown error';
    if (msg.includes('UNIQUE') || msg.includes('already exists')) {
      return NextResponse.json({ error: 'Product name already exists' }, { status: 409 });
    }
    throw e;
  }

  const product = await dbFirst<Product>(
    'SELECT * FROM v_product_stock WHERE id = ?',
    [id]
  );
  return NextResponse.json({ product }, { status: 201 });
}
