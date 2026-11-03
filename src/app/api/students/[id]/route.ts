import { NextRequest, NextResponse } from 'next/server';
import { readExcel, deleteFromExcel, updateExcel } from '@/lib/excel';
import path from 'path';
import fs from 'fs';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const students = await readExcel('students') as { id: string }[];
    const student = students.find((s) => s.id === id);

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: student });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const DELETE = withAuth(async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ok = await deleteFromExcel('students', id);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Student not found or delete failed' }, { status: 404 });
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
        if (value instanceof File) {
          if (value.size > 0) {
            const ext = value.name.split('.').pop() || 'jpg';
            const fileName = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const dir = path.join(process.cwd(), 'public', 'uploads', 'students');
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const buffer = Buffer.from(await value.arrayBuffer());
            fs.writeFileSync(path.join(dir, fileName), buffer);
            updates[key] = `/uploads/students/${fileName}`;
          }
        } else {
          try { updates[key] = JSON.parse(value as string); } catch { updates[key] = value; }
        }
      }
    } else {
      updates = await request.json();
    }

    if (updates.removePhoto === 'true') {
      updates.photo = '';
    }
    delete updates.removePhoto;

    const ok = await updateExcel('students', id, updates);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Student not found or update failed' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { id, ...updates } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
