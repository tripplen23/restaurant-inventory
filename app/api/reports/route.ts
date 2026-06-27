import { NextResponse } from 'next/server';
import { buildAllReports } from '@/lib/server/reports';

export async function GET() {
  return NextResponse.json({ reports: buildAllReports() });
}
