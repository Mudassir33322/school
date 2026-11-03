import { NextRequest, NextResponse } from 'next/server';
import { readExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const examId = searchParams.get('examId');
    const studentId = searchParams.get('studentId');

    let data = await readExcel('results') as Record<string, unknown>[];
    if (examId) data = data.filter((r) => String(r.examId ?? '') === examId);
    if (studentId) data = data.filter((r) => String(r.studentId ?? '') === studentId);

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
