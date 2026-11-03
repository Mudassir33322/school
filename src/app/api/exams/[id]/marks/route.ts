import { NextRequest, NextResponse } from 'next/server';
import { readExcel, appendToExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const subjectId = searchParams.get('subject');

    const results = await readExcel('results') as Record<string, unknown>[];
    let filtered = results.filter((r) => String(r.examId ?? '') === id);
    if (subjectId) {
      filtered = filtered.filter((r) => String(r.subjectId ?? '') === subjectId);
    }
    return NextResponse.json({ success: true, data: filtered });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withAuth(async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { studentId, subjectId, marksObtained, maxMarks, remarks } = body;

    const percentage = maxMarks ? Math.round((marksObtained / maxMarks) * 100) : 0;
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C';
    else if (percentage >= 40) grade = 'D';

    const result = {
      id: `RES-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      examId: id,
      studentId,
      subjectId,
      marksObtained: marksObtained ?? 0,
      maxMarks: maxMarks ?? 100,
      grade,
      remarks: remarks ?? '',
      createdAt: new Date().toISOString(),
    };

    const ok = await appendToExcel('results', result);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Failed to save marks' }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});
