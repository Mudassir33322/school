import { NextRequest, NextResponse } from 'next/server';
import { readExcel, deleteFromExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await readExcel('exams') as Record<string, unknown>[];
    const item = data.find((e) => String(e.id ?? '') === id);
    if (!item) {
      return NextResponse.json({ success: false, message: 'Exam not found' }, { status: 404 });
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
    const ok = await deleteFromExcel('exams', id);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Exam not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { id } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});
