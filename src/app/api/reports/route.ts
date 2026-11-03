import { NextRequest, NextResponse } from 'next/server';
import { readExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type');

    switch (type) {
      case 'attendance': {
        const classId = searchParams.get('classId');
        const month = searchParams.get('month');
        const year = searchParams.get('year');

        let attendance = await readExcel('attendance') as Record<string, unknown>[];
        if (classId) attendance = attendance.filter((a) => String(a.classId ?? '') === classId);
        if (month) attendance = attendance.filter((a) => {
          const d = String(a.date ?? '');
          return d.startsWith(`${year}-${month.padStart(2, '0')}`) || d.split('-')[1] === month;
        });
        if (year) attendance = attendance.filter((a) => String(a.date ?? '').startsWith(year));

        const total = attendance.length;
        const present = attendance.filter((a) => String(a.status ?? '') === 'Present').length;
        const absent = attendance.filter((a) => String(a.status ?? '') === 'Absent').length;
        const late = attendance.filter((a) => String(a.status ?? '') === 'Late').length;
        const leave = attendance.filter((a) => String(a.status ?? '') === 'Leave').length;

        return NextResponse.json({
          success: true,
          data: {
            type: 'attendance',
            total,
            present,
            absent,
            late,
            leave,
            percentage: total > 0 ? Math.round((present / total) * 100) : 0,
            records: attendance,
          },
        });
      }

      case 'fees': {
        const classId = searchParams.get('classId');
        const month = searchParams.get('month');
        const year = searchParams.get('year');

        let fees = await readExcel('fees') as Record<string, unknown>[];
        if (classId) fees = fees.filter((f) => String(f.classId ?? '') === classId);
        if (month) fees = fees.filter((f) => String(f.month ?? '') === month);
        if (year) fees = fees.filter((f) => String(f.year ?? '') === year);

        const total = fees.length;
        const paid = fees.filter((f) => String(f.status ?? '') === 'paid').length;
        const pending = fees.filter((f) => String(f.status ?? '') === 'pending').length;
        const totalAmount = fees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
        const collectedAmount = fees
          .filter((f) => String(f.status ?? '') === 'paid')
          .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

        return NextResponse.json({
          success: true,
          data: {
            type: 'fees',
            total,
            paid,
            pending,
            totalAmount,
            collectedAmount,
            pendingAmount: totalAmount - collectedAmount,
            records: fees,
          },
        });
      }

      case 'students': {
        const classId = searchParams.get('classId');
        const status = searchParams.get('status');

        let students = await readExcel('students') as Record<string, unknown>[];
        if (classId) students = students.filter((s) => String(s.classId ?? '') === classId);
        if (status) students = students.filter((s) => String(s.status ?? '') === status);

        return NextResponse.json({
          success: true,
          data: {
            type: 'students',
            total: students.length,
            records: students,
          },
        });
      }

      case 'exams': {
        const examId = searchParams.get('examId');
        const classId = searchParams.get('classId');

        let results = await readExcel('results') as Record<string, unknown>[];
        if (examId) results = results.filter((r) => String(r.examId ?? '') === examId);
        if (classId) results = results.filter((r) => String(r.classId ?? '') === classId);

        const passed = results.filter((r) => Number(r.percentage) >= 40).length;
        const failed = results.filter((r) => Number(r.percentage) < 40).length;

        return NextResponse.json({
          success: true,
          data: {
            type: 'exams',
            total: results.length,
            passed,
            failed,
            passPercentage: results.length > 0 ? Math.round((passed / results.length) * 100) : 0,
            records: results,
          },
        });
      }

      default:
        return NextResponse.json({ success: false, message: 'Invalid report type' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
