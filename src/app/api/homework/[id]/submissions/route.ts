import { NextRequest, NextResponse } from 'next/server';
import { readExcel, appendToExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const submissions = await readExcel('homework_submissions') as Record<string, unknown>[];
    const filtered = submissions.filter((s) => String(s.homeworkId ?? '') === id);
    return NextResponse.json({ success: true, data: filtered });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});

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
      ...body,
      status: body.status ?? 'Pending',
      submittedAt: new Date().toISOString(),
    };
    const ok = await appendToExcel('homework_submissions', submission);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Failed to save submission' }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: submission }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});
