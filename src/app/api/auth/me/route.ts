import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);

  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true, user });
}
