import { NextRequest, NextResponse } from 'next/server';
import { readExcel, deleteFromExcel, updateExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const teachers = await readExcel('teachers') as { id: string }[];
    const teacher = teachers.find((t) => t.id === id);

    if (!teacher) {
      return NextResponse.json({ success: false, message: 'Teacher not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: teacher });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const DELETE = withAuth(async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ok = await deleteFromExcel('teachers', id);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Teacher not found or delete failed' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { id } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const PUT = withAuth(async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const contentType = request.headers.get('content-type') || '';
    let updates: Record<string, unknown> = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) continue;
        try { updates[key] = JSON.parse(value as string); } catch { updates[key] = value; }
      }
    } else {
      updates = await request.json();
    }

    const ok = await updateExcel('teachers', id, updates);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Teacher not found or update failed' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { id, ...updates } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
