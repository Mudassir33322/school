import { NextRequest, NextResponse } from 'next/server';
import { readExcel, searchExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    let students: Record<string, unknown>[] = [];
    let teachers: Record<string, unknown>[] = [];

    if (!type || type === 'students') {
      if (search) {
        students = await searchExcel('students', { name: search });
      } else {
        students = await readExcel('students') as Record<string, unknown>[];
      }
    }

    if (!type || type === 'teachers') {
      if (search) {
        teachers = await searchExcel('teachers', { name: search });
      } else {
        teachers = await readExcel('teachers') as Record<string, unknown>[];
      }
    }

    return NextResponse.json({
      success: true,
      data: { students, teachers },
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
