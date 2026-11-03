import { NextRequest, NextResponse } from 'next/server';
import { readExcel, appendToExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';


export const POST = withAuth(async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month, year, employeeType } = body;

    const employees = await readExcel(employeeType === 'teacher' ? 'teachers' : 'staff') as Record<string, unknown>[];
    const existingPayroll = await readExcel('payroll') as Record<string, unknown>[];

    const generated: Record<string, unknown>[] = [];
    for (const emp of employees) {
      const alreadyExists = existingPayroll.some(
        (p) =>
          String(p.employeeId ?? '') === String(emp.id ?? '') &&
          Number(p.month) === Number(month) &&
          Number(p.year) === Number(year)
      );
      if (alreadyExists) continue;

      const basicSalary = Number(emp.salary) || 0;
      const allowances = Math.round(basicSalary * 0.2);
      const deductions = Math.round(basicSalary * 0.1);
      const netSalary = basicSalary + allowances - deductions;

      const payroll = {
        id: `PR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        employeeId: String(emp.id ?? ''),
        employeeName: `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim(),
        employeeType: employeeType ?? 'staff',
        month: Number(month),
        year: Number(year),
        basicSalary,
        allowances,
        deductions,
        netSalary,
        status: 'Pending',
        paidDate: '',
        createdAt: new Date().toISOString(),
      };
      await appendToExcel('payroll', payroll);
      generated.push(payroll);
    }

    return NextResponse.json({ success: true, data: generated });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
