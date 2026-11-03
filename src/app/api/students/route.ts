import { NextRequest, NextResponse } from 'next/server';
import { readExcel, appendToExcel, updateExcel, deleteFromExcel, searchExcel } from '@/lib/excel';
import { validateRequest, studentSchema } from '@/lib/validation';
import path from 'path';
import fs from 'fs';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search');
    const classId = searchParams.get('classId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (search || classId || status) {
      const query: Record<string, string> = {};
      if (search) query.name = search;
      if (classId) query.classId = classId;
      if (status) query.status = status;
      const data = await searchExcel('students', query);
      return NextResponse.json({ success: true, data });
    }

    const allData = await readExcel('students');
    const total = allData.length;
    const start = (page - 1) * limit;
    const data = allData.slice(start, start + limit);

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const POST = withAuth(async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let body: Record<string, unknown> = {};

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
            body[key] = `/uploads/students/${fileName}`;
          }
        } else {
          try { body[key] = JSON.parse(value as string); } catch { body[key] = value; }
        }
      }
    } else {
      body = await request.json();
    }

    const validation = validateRequest(studentSchema, body);
    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error }, { status: 400 });
    }

    const students = await readExcel('students');
    const year = new Date().getFullYear();
    const count = students.length + 1;
    const id = `STD-${Date.now()}`;
    const admissionNo = `STD-${year}-${String(count).padStart(3, '0')}`;
    const rollNo = count;

    const student = {
      id,
      admissionNo,
      rollNo,
      ...validation.data,
      createdAt: new Date().toISOString(),
    };

    const ok = await appendToExcel('students', student);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Failed to create student' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: student }, { status: 201 });
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

    const validation = validateRequest(studentSchema.partial(), updates);
    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error }, { status: 400 });
    }

    const ok = await updateExcel('students', id, validation.data);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Student not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id, ...validation.data } });
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

    const ok = await deleteFromExcel('students', id);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Student not found or delete failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
