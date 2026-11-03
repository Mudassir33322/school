import { NextRequest, NextResponse } from 'next/server';
import { readExcel, writeExcel, appendToExcel, deleteFromExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const name = filename.replace('.xlsx', '');
    const data = await readExcel(name);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to read data' }, { status: 500 });
  }
});

export const POST = withAuth(async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const name = filename.replace('.xlsx', '');
    const body = await request.json();
    if (Array.isArray(body)) {
      const ok = await writeExcel(name, body);
      return NextResponse.json({ success: ok });
    }
    const ok = await appendToExcel(name, body);
    return NextResponse.json({ success: ok, data: body });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to write data' }, { status: 500 });
  }
});

export const PATCH = withAuth(async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const name = filename.replace('.xlsx', '');
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }
    const data = await readExcel(name) as Record<string, unknown>[];
    const index = data.findIndex((item) => String(item.id ?? '') === id);
    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }
    data[index] = { ...data[index], ...updates };
    await writeExcel(name, data);
    return NextResponse.json({ success: true, data: data[index] });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to update data' }, { status: 500 });
  }
});

export const DELETE = withAuth(async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const name = filename.replace('.xlsx', '');
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }
    const ok = await deleteFromExcel(name, id);
    return NextResponse.json({ success: ok });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to delete data' }, { status: 500 });
  }
});
