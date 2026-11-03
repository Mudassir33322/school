import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '../types';

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

async function sign(payload: string): Promise<string> {
  const key = await importKey();
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${payload}.${hex}`;
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

export async function getSessionUser(request: NextRequest): Promise<{ id: string; role: UserRole; name: string } | null> {
  const cookie = request.cookies.get('session');
  if (!cookie?.value) return null;
  try {
    const payload = await unsign(cookie.value);
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

export async function requireAuth(request: NextRequest, allowedRoles?: UserRole[]): Promise<NextResponse | null> {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return NextResponse.redirect(new URL(`/${user.role}/dashboard`, request.url));
  }
  return null;
}

export async function createSession(response: NextResponse, user: { id: string; role: UserRole; name: string }): Promise<void> {
  const payload = JSON.stringify({ id: user.id, role: user.role, name: user.name });
  const signed = await sign(payload);
  response.cookies.set('session', signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 86400,
  });
}

export async function destroySession(response: NextResponse): Promise<void> {
  response.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
