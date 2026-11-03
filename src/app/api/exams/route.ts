import { NextRequest, NextResponse } from 'next/server';
import { readExcel, appendToExcel, updateExcel, deleteFromExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const classId = searchParams.get('classId');
    const type = searchParams.get('type');

    let data = await readExcel('exams') as Record<string, unknown>[];
    if (classId) data = data.filter((e) => String(e.classId ?? '') === classId);
    if (type) data = data.filter((e) => String(e.type ?? '') === type);

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const POST = withAuth(async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const exam = {
      id: `EXM-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    };

    const ok = await appendToExcel('exams', exam);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Failed to create exam' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: exam }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const PUT = withAuth(async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const ok = await updateExcel('exams', id, updates);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Exam not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id, ...updates } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const DELETE = withAuth(async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const ok = await deleteFromExcel('exams', id);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Exam not found or delete failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
