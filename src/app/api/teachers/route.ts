import { NextRequest, NextResponse } from 'next/server';
import { readExcel, appendToExcel, updateExcel, deleteFromExcel, searchExcel } from '@/lib/excel';
import { validateRequest, teacherSchema } from '@/lib/validation';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search');
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (search || department || status) {
      const query: Record<string, string> = {};
      if (search) query.name = search;
      if (department) query.department = department;
      if (status) query.status = status;
      const data = await searchExcel('teachers', query);
      return NextResponse.json({ success: true, data });
    }

    const allData = await readExcel('teachers');
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
        if (value instanceof File) continue;
        try { body[key] = JSON.parse(value as string); } catch { body[key] = value; }
      }
    } else {
      body = await request.json();
    }

    const validation = validateRequest(teacherSchema, body);
    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error }, { status: 400 });
    }

    const teachers = await readExcel('teachers');
    const year = new Date().getFullYear();
    const count = teachers.length + 1;
    const id = `TCH-${Date.now()}`;
    const employeeId = `TCH-${year}-${String(count).padStart(3, '0')}`;

    const teacher = {
      id,
      employeeId,
      ...validation.data,
      createdAt: new Date().toISOString(),
    };

    const ok = await appendToExcel('teachers', teacher);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Failed to create teacher' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: teacher }, { status: 201 });
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

    const validation = validateRequest(teacherSchema.partial(), updates);
    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error }, { status: 400 });
    }

    const ok = await updateExcel('teachers', id, validation.data);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Teacher not found or update failed' }, { status: 404 });
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

    const ok = await deleteFromExcel('teachers', id);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Teacher not found or delete failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
