import { NextRequest, NextResponse } from 'next/server';
import { readExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const results = await readExcel('results') as Record<string, unknown>[];
    const filtered = results.filter((r) => String(r.examId ?? '') === id);
    return NextResponse.json({ success: true, data: filtered });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});
