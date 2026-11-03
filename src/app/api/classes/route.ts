import { NextRequest, NextResponse } from 'next/server';
import { readExcel, appendToExcel, updateExcel, deleteFromExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search');

    let data = await readExcel('classes') as Record<string, unknown>[];
    if (search) {
      data = data.filter((c) =>
        String(c.name ?? '').toLowerCase().includes(search.toLowerCase())
      );
    }
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const POST = withAuth(async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, numeric, sections } = body;
    if (!name) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    const classEntry = {
      id: `CLS-${Date.now()}`,
      name,
      numeric: numeric ?? null,
      sections: sections ?? [],
      createdAt: new Date().toISOString(),
    };

    const ok = await appendToExcel('classes', classEntry);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Failed to create class' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: classEntry }, { status: 201 });
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

    const ok = await updateExcel('classes', id, updates);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Class not found or update failed' }, { status: 404 });
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

    const ok = await deleteFromExcel('classes', id);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Class not found or delete failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
