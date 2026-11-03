import { NextRequest, NextResponse } from 'next/server';
import { readExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const students = await readExcel('students') as Record<string, unknown>[];
    const student = students.find((s) => String(s.id ?? '') === id);
    const classId = student ? String(student.classId ?? '') : '';

    const exams = await readExcel('exams') as Record<string, unknown>[];
    const filtered = exams.filter((e) => {
      const classIds = (e.classIds as string[]) ?? [];
      return classIds.includes(classId);
    });
    return NextResponse.json({ success: true, data: filtered });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});
