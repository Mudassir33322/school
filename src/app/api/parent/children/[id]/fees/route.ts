import { NextRequest, NextResponse } from 'next/server';
import { readExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fees = await readExcel('fees') as Record<string, unknown>[];
    const filtered = fees.filter((f) => String(f.studentId ?? '') === id);
    return NextResponse.json({ success: true, data: filtered });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});
