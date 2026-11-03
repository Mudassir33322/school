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
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const attendance = await readExcel('attendance') as Record<string, unknown>[];
    let filtered = attendance.filter((a) => String(a.studentId ?? '') === id);
    if (month) {
      filtered = filtered.filter((a) => {
        const d = String(a.date ?? '');
        return d.includes(`-${month.padStart(2, '0')}-`);
      });
    }
    if (year) {
      filtered = filtered.filter((a) => String(a.date ?? '').startsWith(year));
    }
    return NextResponse.json({ success: true, data: filtered });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});
