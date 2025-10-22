import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const SESSION_COOKIE_NAME = 'session'
const SESSION_TTL_HOURS = 12

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export async function createSession(userId: string, opts?: { userAgent?: string | null; ip?: string | null }) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000)

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

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })

  return { sessionId: session.id, expiresAt }
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
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSessionSecret())
    const sessionId = String(payload.sessionId || '')
    if (!sessionId) return null

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    })
    if (!session) return null
    if (session.revokedAt) return null
    if (session.expiresAt.getTime() < Date.now()) return null
    return session
  } catch {
    return null
  }
}

export const SessionCookie = {
  name: SESSION_COOKIE_NAME,
  ttlHours: SESSION_TTL_HOURS,
}


