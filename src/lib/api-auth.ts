import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { UserRole } from '@/types';

const SESSION_SECRET = process.env.SESSION_SECRET || 'school-ms-secret-key-change-in-production';

async function importKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function unsign(signed: string): Promise<string | null> {
  const idx = signed.lastIndexOf('.');
  if (idx === -1) return null;
  const payload = signed.substring(0, idx);
  const sig = signed.substring(idx + 1);
  const key = await importKey();
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    Uint8Array.from(sig.match(/.{2}/g)!.map(h => parseInt(h, 16))),
    new TextEncoder().encode(payload)
  );
  return valid ? payload : null;
}

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
}

export async function getApiSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie?.value) return null;
  try {
    const payload = await unsign(sessionCookie.value);
    if (!payload) return null;
    const data = JSON.parse(payload);
    if (!data || !data.id || !data.role || !data.name) return null;
    const validRoles: UserRole[] = ['admin', 'teacher', 'student', 'parent'];
    if (!validRoles.includes(data.role)) return null;
    return { id: data.id, role: data.role, name: data.name };
  } catch {
    return null;
  }
}

export async function requireApiAuth(
  allowedRoles?: UserRole[]
): Promise<{ user: AuthUser; error?: never } | { user?: never; error: NextResponse }> {
  const user = await getApiSession();
  if (!user) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      ),
    };
  }
  return { user };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withAuth(handler: (...args: any[]) => Promise<NextResponse>, allowedRoles?: UserRole[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (...args: any[]) => {
    const auth = await requireApiAuth(allowedRoles);
    if (auth.error) return auth.error;
    return handler(...args);
  };
}
