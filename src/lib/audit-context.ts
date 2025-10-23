import { NextRequest } from 'next/server'
import { getSessionFromCookie } from '@/lib/auth/session'

/**
 * Extract audit context from request for logging
 * Returns user info, IP, and user agent for audit trails
 */
export async function getUserContextFromRequest(request: NextRequest) {
  // Extract IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown'

  // Extract user agent
  const userAgent = request.headers.get('user-agent') || 'unknown'

  // Try to get user from session
  let userId: string | undefined
  let phone: string | undefined

  try {
    const session = await getSessionFromCookie()
    
    if (session?.user) {
      userId = session.user.id
      phone = session.user.phoneE164
    }
  } catch (error) {
    // If session verification fails, continue without user info
    // This can happen for unauthenticated requests
  }

  return {
    userId: userId || null,
    phone: phone || null,
    ip,
    userAgent
  }
}

