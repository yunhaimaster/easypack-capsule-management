import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const SESSION_COOKIE_NAME = 'session'
const SESSION_TTL_SHORT_HOURS = 12  // 不信任裝置：12 小時
const SESSION_TTL_LONG_DAYS = 30    // 信任裝置：30 天

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export async function createSession(
  userId: string, 
  opts?: { userAgent?: string | null; ip?: string | null; trustDevice?: boolean }
) {
  // 如果信任裝置 → 30 天，否則 → 12 小時
  const ttlMs = opts?.trustDevice 
    ? SESSION_TTL_LONG_DAYS * 24 * 60 * 60 * 1000 
    : SESSION_TTL_SHORT_HOURS * 60 * 60 * 1000
  
  const expiresAt = new Date(Date.now() + ttlMs)

  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt,
      userAgent: opts?.userAgent || null,
      ip: opts?.ip || null,
    },
    select: { id: true, expiresAt: true },
  })

  const token = await new SignJWT({ sessionId: session.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .setIssuedAt()
    .sign(getSessionSecret())

  return { 
    sessionId: session.id, 
    expiresAt,
    token,
    cookieName: SESSION_COOKIE_NAME
  }
}

export async function revokeSession(sessionId: string) {
  await prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getSessionFromCookie() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  
  console.log('[Session] Cookie token present:', !!token)
  
  if (!token) return null

  try {
    const secret = getSessionSecret()
    console.log('[Session] Secret loaded:', !!secret)
    
    const { payload } = await jwtVerify(token, secret)
    const sessionId = String(payload.sessionId || '')
    
    console.log('[Session] JWT verified, sessionId:', sessionId)
    
    if (!sessionId) return null

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    })
    
    console.log('[Session] DB session found:', !!session)
    
    if (!session) return null
    if (session.revokedAt) {
      console.log('[Session] Session revoked')
      return null
    }
    if (session.expiresAt.getTime() < Date.now()) {
      console.log('[Session] Session expired')
      return null
    }
    
    console.log('[Session] Valid session for user:', session.userId)
    return session
  } catch (error) {
    console.error('[Session] Verification failed:', error)
    return null
  }
}

export const SessionCookie = {
  name: SESSION_COOKIE_NAME,
  ttlShortHours: SESSION_TTL_SHORT_HOURS,
  ttlLongDays: SESSION_TTL_LONG_DAYS,
}


