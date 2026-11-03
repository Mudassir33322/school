import { NextRequest, NextResponse } from 'next/server';
import { readExcel, appendToExcel, updateExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';


export const POST = withAuth(async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, amount, paymentMode, receiptNo, remarks } = body;

    const fees = await readExcel('fees') as Record<string, unknown>[];
    const feeIndex = fees.findIndex((f) => String(f.id ?? '') === body.feeId);

    if (feeIndex !== -1) {
      const fee = fees[feeIndex];
      const newPaidAmount = (Number(fee.paidAmount) || 0) + (Number(amount) || 0);
      const newStatus = newPaidAmount >= Number(fee.amount) ? 'Paid' : 'Partial';
      await updateExcel('fees', String(fee.id), {
        paidAmount: newPaidAmount,
        status: newStatus,
        paidDate: new Date().toISOString(),
        paymentMode: paymentMode ?? '',
        receiptNo: receiptNo ?? '',
        remarks: remarks ?? '',
      });
      return NextResponse.json({ success: true, data: { ...fee, paidAmount: newPaidAmount, status: newStatus } });
    }

    const newFee = {
      id: `FEE-${Date.now()}`,
      studentId: studentId ?? '',
      admissionNo: body.admissionNo ?? '',
      category: body.category ?? 'Tuition',
      amount: Number(amount) || 0,
      paidAmount: Number(amount) || 0,
      dueDate: body.dueDate ?? '',
      paidDate: new Date().toISOString(),
      status: 'Paid',
      paymentMode: paymentMode ?? '',
      receiptNo: receiptNo ?? '',
      fine: 0,
      remarks: remarks ?? '',
      academicYear: body.academicYear ?? '',
      createdAt: new Date().toISOString(),
    };
    const ok = await appendToExcel('fees', newFee);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Failed to collect fee' }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: newFee }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
