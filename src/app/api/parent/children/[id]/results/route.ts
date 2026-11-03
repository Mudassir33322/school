import { NextRequest, NextResponse } from 'next/server';
import { readExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const examId = searchParams.get('examId');

    const results = await readExcel('results') as Record<string, unknown>[];
    let filtered = results.filter((r) => String(r.studentId ?? '') === id);
    if (examId) {
      filtered = filtered.filter((r) => String(r.examId ?? '') === examId);
    }
    return NextResponse.json({ success: true, data: filtered });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});
