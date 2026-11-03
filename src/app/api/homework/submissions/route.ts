import { NextRequest, NextResponse } from 'next/server';
import { readExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const studentId = searchParams.get('studentId');

    const submissions = await readExcel('homework_submissions') as Record<string, unknown>[];
    if (studentId) {
      const filtered = submissions.filter((s) => String(s.studentId ?? '') === studentId);
      return NextResponse.json({ success: true, data: filtered });
    }
    return NextResponse.json({ success: true, data: submissions });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
