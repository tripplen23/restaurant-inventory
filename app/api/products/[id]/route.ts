import { NextRequest, NextResponse } from 'next/server';
import { dbRun } from '@/lib/server/db';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const fields: string[] = [];
  const values: (string | number)[] = [];
  if (typeof body.name === 'string' && body.name.trim()) {
    fields.push('name = ?');
    values.push(body.name.trim());
  }
  if (typeof body.unit === 'string' && body.unit.trim()) {
    fields.push('unit = ?');
    values.push(body.unit.trim());
  }
  if (Number.isFinite(body.threshold) && (body.threshold as number) >= 0) {
    fields.push('threshold = ?');
    values.push(body.threshold);
  }
  if (!fields.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  values.push(id);
  const r = await dbRun(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
  if (r.rowsAffected === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const r = await dbRun('DELETE FROM products WHERE id = ?', [id]);
  if (r.rowsAffected === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
