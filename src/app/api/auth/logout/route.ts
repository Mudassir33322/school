import { NextResponse } from 'next/server';
import { destroySession } from '@/middleware/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  await destroySession(response);
  return response;
}
