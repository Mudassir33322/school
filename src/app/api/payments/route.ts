import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import {
  getPayments,
  createPayment,
  updatePaymentStatus,
  getPaymentSummary,
  processRazorpayPayment,
  processJazzCashPayment,
  processEasyPaisaPayment,
} from '@/services/payment-service';

export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const studentId = searchParams.get('studentId') || undefined;
    const status = searchParams.get('status') || undefined;
    const summary = searchParams.get('summary');

    if (summary === 'true') {
      const data = await getPaymentSummary();
      return NextResponse.json({ success: true, data });
    }

    const payments = await getPayments({ studentId, status });
    return NextResponse.json({ success: true, data: payments });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const POST = withAuth(async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.method === 'Razorpay') {
      const result = await processRazorpayPayment(body);
      if (!result) {
        return NextResponse.json({ success: false, message: 'Payment processing failed' }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: result }, { status: 201 });
    }

    if (body.method === 'JazzCash') {
      const result = await processJazzCashPayment(body);
      if (!result) {
        return NextResponse.json({ success: false, message: 'Payment processing failed' }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: result }, { status: 201 });
    }

    if (body.method === 'EasyPaisa') {
      const result = await processEasyPaisaPayment(body);
      if (!result) {
        return NextResponse.json({ success: false, message: 'Payment processing failed' }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: result }, { status: 201 });
    }

    if (!body.studentId || !body.amount) {
      return NextResponse.json({ success: false, message: 'studentId and amount are required' }, { status: 400 });
    }

    const payment = await createPayment(body);
    if (!payment) {
      return NextResponse.json({ success: false, message: 'Failed to create payment' }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const PUT = withAuth(async function PUT(request: NextRequest) {
  try {
    const { id, status, transactionId } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ success: false, message: 'id and status are required' }, { status: 400 });
    }

    const ok = await updatePaymentStatus(id, status, transactionId);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Payment not found or update failed' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { id, status } });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
