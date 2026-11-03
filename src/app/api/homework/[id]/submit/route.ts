import { NextRequest, NextResponse } from 'next/server';
import { appendToExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';

export const POST = withAuth(async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const submission = {
      id: `SUB-${Date.now()}`,
      homeworkId: id,
      studentId: body.studentId ?? '',
      submission: body.submission ?? '',
      remarks: body.remarks ?? '',
      marks: 0,
      status: 'Submitted',
      submittedAt: new Date().toISOString(),
    };
    const ok = await appendToExcel('homework_submissions', submission);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Failed to submit homework' }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: submission }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});
