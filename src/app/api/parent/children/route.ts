import { NextRequest, NextResponse } from 'next/server';
import { readExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const parentId = searchParams.get('parentId');

    const parents = await readExcel('parents') as Record<string, unknown>[];
    const students = await readExcel('students') as Record<string, unknown>[];

    if (parentId) {
      const parent = parents.find((p) => String(p.id ?? '') === parentId);
      if (!parent) {
        return NextResponse.json({ success: true, data: [] });
      }
      const childIds = (parent.children as string[]) ?? [];
      const children = students.filter((s) => childIds.includes(String(s.id ?? '')));
      return NextResponse.json({ success: true, data: children });
    }

    const allChildren = students.filter((s) => {
      return parents.some((p) => {
        const childIds = (p.children as string[]) ?? [];
        return childIds.includes(String(s.id ?? ''));
      });
    });

    return NextResponse.json({ success: true, data: allChildren.length > 0 ? allChildren : students });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})
