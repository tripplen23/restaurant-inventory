import { NextResponse } from 'next/server';
import { buildAllReports } from '@/lib/server/reports';

export async function GET() {
  const reports = await buildAllReports();
  return NextResponse.json({ reports });
}
