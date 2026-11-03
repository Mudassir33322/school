import { NextRequest, NextResponse } from 'next/server';
import { updateExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';

export const PATCH = withAuth(async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ok = await updateExcel('payroll', id, {
      status: 'Paid',
      paidDate: new Date().toISOString(),
    });
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Payroll record not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { id, status: 'Paid' } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});
