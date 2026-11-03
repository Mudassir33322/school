import { NextRequest, NextResponse } from 'next/server';
import { readExcel, appendToExcel, updateExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');

    let data = await readExcel('payroll') as Record<string, unknown>[];
    if (month) data = data.filter((p) => String(p.month ?? '') === month);
    if (year) data = data.filter((p) => String(p.year ?? '') === year);
    if (status) data = data.filter((p) => String(p.status ?? '') === status);

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const POST = withAuth(async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payroll = {
      id: `PR-${Date.now()}`,
      ...body,
      status: body.status ?? 'pending',
      createdAt: new Date().toISOString(),
    };

    const ok = await appendToExcel('payroll', payroll);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Failed to create payroll record' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: payroll }, { status: 201 });
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

    const payload = { ...updates };
    if (updates.status === 'paid') {
      payload.paidAt = payload.paidAt ?? new Date().toISOString();
    }

    const ok = await updateExcel('payroll', id, payload);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Payroll record not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id, ...payload } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
