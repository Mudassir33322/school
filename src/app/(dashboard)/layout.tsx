import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/app-shell'

const SESSION_SECRET = process.env.SESSION_SECRET || 'school-ms-secret-key-change-in-production'

async function verifySession(signed: string): Promise<{ id: string; role: string; name: string } | null> {
  const idx = signed.lastIndexOf('.')
  if (idx === -1) return null
  const payload = signed.substring(0, idx)
  const sig = signed.substring(idx + 1)
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(SESSION_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      Uint8Array.from(sig.match(/.{2}/g)!.map(h => parseInt(h, 16))),
      new TextEncoder().encode(payload)
    )
    if (!valid) return null
    const data = JSON.parse(payload)
    if (!data?.id || !data?.role || !data?.name) return null
    return { id: data.id, role: data.role, name: data.name }
  } catch {
    return null
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')

  if (!sessionCookie?.value) {
    redirect('/login')
  }

  const session = await verifySession(sessionCookie.value)

  if (!session) {
    redirect('/login')
  }

  return <AppShell role={session.role as 'admin' | 'teacher' | 'student' | 'parent'}>{children}</AppShell>
}
