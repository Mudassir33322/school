import { NextRequest, NextResponse } from 'next/server';
import { readExcel, writeExcel } from '@/lib/excel';
import { withAuth } from '@/lib/api-auth';


export const GET = withAuth(async function GET() {
  try {
    const data = await readExcel('settings') as Record<string, unknown>[];
    const settings = data.length > 0 ? data[0] : {};
    return NextResponse.json({ success: true, data: settings });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
})

export const POST = withAuth(async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const { id: _id, updatedAt: _updatedAt, ...cleanBody } = body;
    const ok = await writeExcel('settings', [{ id: 'school-settings', ...cleanBody, updatedAt: new Date().toISOString() }]);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Failed to save settings' }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: cleanBody });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
})
