import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Auth gate (exclude login page and API routes)
  const { pathname } = request.nextUrl
  
  // Allow API routes and login page
  if (pathname === '/login' || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  // Check if session cookie exists (Edge Runtime compatible)
  const sessionCookie = request.cookies.get('session')
  
  if (!sessionCookie?.value) {
    console.log('[Middleware] No session cookie, redirecting to /login')
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }
  
  // Cookie exists - allow access
  // Full validation happens in API routes (Node Runtime)
  console.log('[Middleware] Session cookie present, allowing access')

  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.com https://vercel.live",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' https://openrouter.ai https://vercel.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
