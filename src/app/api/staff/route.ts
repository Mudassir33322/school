import { NextRequest, NextResponse } from 'next/server';
import { readExcel, appendToExcel, updateExcel, deleteFromExcel, searchExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search');
    const department = searchParams.get('department');
    const status = searchParams.get('status');

    if (search || department || status) {
      const query: Record<string, string> = {};
      if (search) query.name = search;
      if (department) query.department = department;
      if (status) query.status = status;
      const data = await searchExcel('staff', query);
      return NextResponse.json({ success: true, data });
    }

    const data = await readExcel('staff');
    return NextResponse.json({ success: true, data });
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

    const staff = await readExcel('staff');
    const year = new Date().getFullYear();
    const count = staff.length + 1;
    const id = `STF-${Date.now()}`;
    const employeeId = `STF-${year}-${String(count).padStart(3, '0')}`;

    const staffMember = {
      id,
      employeeId,
      ...body,
      createdAt: new Date().toISOString(),
    };

    const ok = await appendToExcel('staff', staffMember);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Failed to create staff' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: staffMember }, { status: 201 });
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

    const ok = await updateExcel('staff', id, updates);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Staff not found or update failed' }, { status: 404 });
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

    const ok = await deleteFromExcel('staff', id);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Staff not found or delete failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
