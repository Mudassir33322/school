import { NextRequest, NextResponse } from 'next/server';
import { readExcel, appendToExcel, updateExcel, deleteFromExcel } from '@/lib/excel';
import { validateRequest, feeSchema } from '@/lib/validation';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    let data = await readExcel('fees') as Record<string, unknown>[];
    if (studentId) data = data.filter((f) => String(f.studentId ?? '') === studentId);
    if (status) data = data.filter((f) => String(f.status ?? '') === status);
    if (category) data = data.filter((f) => String(f.category ?? '') === category);

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const POST = withAuth(async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateRequest(feeSchema, body);
    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error }, { status: 400 });
    }

    const fee = {
      id: `FEE-${Date.now()}`,
      ...validation.data,
      createdAt: new Date().toISOString(),
    };

    const ok = await appendToExcel('fees', fee);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Failed to create fee record' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: fee }, { status: 201 });
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

    const validation = validateRequest(feeSchema.partial(), updates);
    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error }, { status: 400 });
    }

    const payload: Record<string, unknown> = { ...validation.data };
    if (validation.data.status === 'Paid' && !updates.paidDate) {
      payload.paidDate = new Date().toISOString();
    }

    const ok = await updateExcel('fees', id, payload);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Fee record not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id, ...payload } });
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

    const ok = await deleteFromExcel('fees', id);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Fee record not found or delete failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
