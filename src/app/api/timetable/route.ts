import { NextRequest, NextResponse } from 'next/server';
import { readExcel, appendToExcel, updateExcel, deleteFromExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const classId = searchParams.get('classId');
    const day = searchParams.get('day');
    const teacherId = searchParams.get('teacherId');

    let data = await readExcel('timetable') as Record<string, unknown>[];
    if (classId) data = data.filter((t) => String(t.classId ?? '') === classId);
    if (day) data = data.filter((t) => String(t.day ?? '').toLowerCase() === day.toLowerCase());
    if (teacherId) data = data.filter((t) => String(t.teacherId ?? '') === teacherId);

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const POST = withAuth(async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entry = {
      id: `TT-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    };

    const ok = await appendToExcel('timetable', entry);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Failed to create timetable entry' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
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

    const ok = await updateExcel('timetable', id, updates);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Timetable entry not found or update failed' }, { status: 404 });
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

    const ok = await deleteFromExcel('timetable', id);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Timetable entry not found or delete failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
