import { NextRequest, NextResponse } from 'next/server';
import { readExcel, appendToExcel, updateExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const examId = searchParams.get('examId');
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');

    let data = await readExcel('results') as Record<string, unknown>[];
    if (examId) data = data.filter((r) => String(r.examId ?? '') === examId);
    if (studentId) data = data.filter((r) => String(r.studentId ?? '') === studentId);
    if (classId) data = data.filter((r) => String(r.classId ?? '') === classId);

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const POST = withAuth(async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { marks, totalMarks, ...rest } = body;

    const percentage = totalMarks && marks ? Math.round((marks / totalMarks) * 100) : 0;
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C';
    else if (percentage >= 40) grade = 'D';

    const result = {
      id: `RES-${Date.now()}`,
      ...rest,
      marks: marks ?? 0,
      totalMarks: totalMarks ?? 0,
      percentage,
      grade,
      createdAt: new Date().toISOString(),
    };

    const ok = await appendToExcel('results', result);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Failed to save result' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const PUT = withAuth(async function PUT(request: NextRequest) {
  try {
    const { id, marks, totalMarks, ...updates } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const payload: Record<string, unknown> = { ...updates };
    if (marks !== undefined) payload.marks = marks;
    if (totalMarks !== undefined) payload.totalMarks = totalMarks;

    const finalMarks = (payload.marks as number) ?? 0;
    const finalTotal = (payload.totalMarks as number) ?? 0;
    if (finalTotal > 0) {
      const percentage = Math.round((finalMarks / finalTotal) * 100);
      payload.percentage = percentage;
      if (percentage >= 90) payload.grade = 'A+';
      else if (percentage >= 80) payload.grade = 'A';
      else if (percentage >= 70) payload.grade = 'B+';
      else if (percentage >= 60) payload.grade = 'B';
      else if (percentage >= 50) payload.grade = 'C';
      else if (percentage >= 40) payload.grade = 'D';
      else payload.grade = 'F';
    }

    const ok = await updateExcel('results', id, payload);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Result not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id, ...payload } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
