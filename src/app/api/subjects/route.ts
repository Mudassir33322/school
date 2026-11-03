import { NextRequest, NextResponse } from 'next/server';
import { readExcel, appendToExcel, updateExcel, deleteFromExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const classId = searchParams.get('classId');

    let data = await readExcel('subjects') as Record<string, unknown>[];
    if (classId) {
      data = data.filter((s) => String(s.classId ?? '') === classId);
    }
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const POST = withAuth(async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const subject = {
      id: `SUB-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    };

    const ok = await appendToExcel('subjects', subject);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Failed to create subject' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: subject }, { status: 201 });
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

    const ok = await updateExcel('subjects', id, updates);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Subject not found or update failed' }, { status: 404 });
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

    const ok = await deleteFromExcel('subjects', id);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Subject not found or delete failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
