import { NextRequest, NextResponse } from 'next/server';
import { deleteFromExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';

export const DELETE = withAuth(async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ok = await deleteFromExcel('notices', id);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Notice not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { id } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});
