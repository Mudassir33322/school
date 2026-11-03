import { NextResponse } from 'next/server';
import { readExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET() {
  try {
    const students = await readExcel('students') as Record<string, unknown>[];
    const teachers = await readExcel('teachers') as Record<string, unknown>[];
    const staff = await readExcel('staff') as Record<string, unknown>[];
    const attendance = await readExcel('attendance') as Record<string, unknown>[];
    const fees = await readExcel('fees') as Record<string, unknown>[];

    const activeStudents = students.filter((s) => String(s.status ?? '') === 'Active').length;
    const activeTeachers = teachers.filter((t) => String(t.status ?? '') === 'Active').length;
    const activeStaff = staff.filter((s) => String(s.status ?? '') === 'Active').length;

    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter((a) => String(a.date ?? '') === today);
    const todayPresent = todayAttendance.filter((a) => String(a.status ?? '') === 'Present').length;
    const todayPercentage = todayAttendance.length > 0
      ? Math.round((todayPresent / todayAttendance.length) * 100)
      : 0;

    const totalFees = fees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const collectedFees = fees
      .filter((f) => String(f.status ?? '') === 'paid')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        totalStudents: students.length,
        activeStudents,
        totalTeachers: teachers.length,
        activeTeachers,
        totalStaff: staff.length,
        activeStaff,
        todayAttendance: {
          total: todayAttendance.length,
          present: todayPresent,
          percentage: todayPercentage,
        },
        fees: {
          total: totalFees,
          collected: collectedFees,
          pending: totalFees - collectedFees,
        },
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
