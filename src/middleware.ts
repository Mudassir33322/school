import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionUser } from './middleware/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/login' || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  if (pathname === '/') {
    const user = await getSessionUser(request)
    if (user) {
      return NextResponse.redirect(new URL(`/${user.role}/dashboard`, request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const user = await getSessionUser(request)

  if (pathname.startsWith('/admin') || pathname.startsWith('/teacher') ||
      pathname.startsWith('/student') || pathname.startsWith('/parent')) {

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const routeRole = pathname.split('/')[1] as string
    if (user.role !== routeRole) {
      return NextResponse.redirect(new URL(`/${user.role}/dashboard`, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
