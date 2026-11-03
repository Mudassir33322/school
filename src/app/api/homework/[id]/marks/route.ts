import { NextRequest, NextResponse } from 'next/server';
import { readExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';

export const POST = withAuth(async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { submissionId, marks, remarks } = body;

    const submissions = await readExcel('homework_submissions') as Record<string, unknown>[];
    const index = submissions.findIndex(
      (s) => String(s.id ?? '') === submissionId && String(s.homeworkId ?? '') === id
    );

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Submission not found' }, { status: 404 });
    }

    submissions[index].marks = marks ?? 0;
    submissions[index].remarks = remarks ?? '';
    submissions[index].status = 'Graded';

    return NextResponse.json({ success: true, data: submissions[index] });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});
