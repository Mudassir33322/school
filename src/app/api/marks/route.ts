import { NextRequest, NextResponse } from 'next/server';
import { readExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ success: false, message: 'studentId is required' }, { status: 400 });
    }

    const results = await readExcel('results') as Record<string, unknown>[];
    const filtered = results.filter((r) => String(r.studentId ?? '') === studentId);
    return NextResponse.json({ success: true, data: filtered });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
