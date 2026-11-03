import { NextRequest, NextResponse } from 'next/server';
import { readExcel, appendToExcel, deleteFromExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    let data = await readExcel('notices') as Record<string, unknown>[];
    if (type) data = data.filter((n) => String(n.type ?? '') === type);
    if (fromDate) data = data.filter((n) => String(n.date ?? '') >= fromDate);
    if (toDate) data = data.filter((n) => String(n.date ?? '') <= toDate);

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const POST = withAuth(async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const notice = {
      id: `NOT-${Date.now()}`,
      ...body,
      date: body.date ?? new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    const ok = await appendToExcel('notices', notice);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Failed to create notice' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: notice }, { status: 201 });
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

    const ok = await deleteFromExcel('notices', id);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Notice not found or delete failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
