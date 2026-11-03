import { NextRequest, NextResponse } from 'next/server';
import { readExcel, appendToExcel, updateExcel, deleteFromExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const status = searchParams.get('status');

    let data = await readExcel('homework') as Record<string, unknown>[];
    if (classId) data = data.filter((h) => String(h.classId ?? '') === classId);
    if (subjectId) data = data.filter((h) => String(h.subjectId ?? '') === subjectId);
    if (status) data = data.filter((h) => String(h.status ?? '') === status);

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const POST = withAuth(async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const homework = {
      id: `HW-${Date.now()}`,
      ...body,
      status: body.status ?? 'active',
      createdAt: new Date().toISOString(),
    };

    const ok = await appendToExcel('homework', homework);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Failed to create homework' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: homework }, { status: 201 });
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

    const ok = await updateExcel('homework', id, updates);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Homework not found or update failed' }, { status: 404 });
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

    const ok = await deleteFromExcel('homework', id);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Homework not found or delete failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
