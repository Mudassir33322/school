import { NextRequest, NextResponse } from 'next/server';
import { readExcel, deleteFromExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await readExcel('homework') as Record<string, unknown>[];
    const item = data.find((h) => String(h.id ?? '') === id);
    if (!item) {
      return NextResponse.json({ success: false, message: 'Homework not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});

export const DELETE = withAuth(async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ok = await deleteFromExcel('homework', id);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Homework not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { id } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});

export const PUT = withAuth(async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const data = await readExcel('homework') as Record<string, unknown>[];
    const index = data.findIndex((h) => String(h.id ?? '') === id);
    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Homework not found' }, { status: 404 });
    }
    data[index] = { ...data[index], ...updates };
    return NextResponse.json({ success: true, data: data[index] });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});
