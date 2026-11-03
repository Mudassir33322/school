import { NextRequest, NextResponse } from 'next/server';
import { readExcel, appendToExcel, updateExcel, deleteFromExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const date = searchParams.get('date');
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    const studentId = searchParams.get('studentId');

    let data = await readExcel('attendance') as Record<string, unknown>[];
    if (date) data = data.filter((a) => String(a.date ?? '') === date);
    if (classId) data = data.filter((a) => String(a.classId ?? '') === classId);
    if (sectionId) data = data.filter((a) => String(a.sectionId ?? '') === sectionId);
    if (studentId) data = data.filter((a) => String(a.studentId ?? '') === studentId);

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const POST = withAuth(async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { records } = body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ success: false, message: 'Records array is required' }, { status: 400 });
    }

    const created = [];
    for (const record of records) {
      const { studentId, status, date } = record;
      if (!studentId || !status || !date) {
        return NextResponse.json({ success: false, message: 'Each record needs studentId, status, date' }, { status: 400 });
      }

      const entry = {
        id: `ATT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        studentId,
        status,
        date,
        ...record,
        createdAt: new Date().toISOString(),
      };

      const ok = await appendToExcel('attendance', entry);
      if (!ok) {
        return NextResponse.json({ success: false, message: 'Failed to save attendance' }, { status: 500 });
      }
      created.push(entry);
    }

    return NextResponse.json({ success: true, data: created }, { status: 201 });
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

    const ok = await updateExcel('attendance', id, updates);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Attendance record not found or update failed' }, { status: 404 });
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

    const ok = await deleteFromExcel('attendance', id);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Attendance record not found or delete failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
