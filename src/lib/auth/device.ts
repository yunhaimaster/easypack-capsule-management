import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { createHash, createHmac, randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'

const DEVICE_COOKIE_NAME = 'device'
const DEVICE_TTL_DAYS = 30

function getDeviceSecret(): Uint8Array {
  const secret = process.env.DEVICE_TOKEN_SECRET
  if (!secret) throw new Error('DEVICE_TOKEN_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export function generateDeviceId(): string {
  return randomBytes(32).toString('hex')
}

export function hashDeviceId(deviceId: string): string {
  const secret = process.env.DEVICE_TOKEN_SECRET || 'fallback'
  return createHmac('sha256', secret).update(deviceId).digest('hex')
}

export async function createTrustedDevice(userId: string, deviceId: string, opts?: { userAgent?: string | null; ip?: string | null }) {
  const expiresAt = new Date(Date.now() + DEVICE_TTL_DAYS * 24 * 60 * 60 * 1000)
  const deviceIdHash = hashDeviceId(deviceId)

  await prisma.trustedDevice.upsert({
    where: { userId_deviceIdHash: { userId, deviceIdHash } },
    create: {
      userId,
      deviceIdHash,
      userAgent: opts?.userAgent || null,
      ipFirstUsed: opts?.ip || null,
      expiresAt,
    },
    update: { lastSeenAt: new Date(), expiresAt },
  })

  const token = await new SignJWT({ deviceId, userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .setIssuedAt()
    .sign(getDeviceSecret())

  const cookieStore = await cookies()
  cookieStore.set(DEVICE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })

  return { expiresAt }
}

export async function verifyTrustedDevice() {
  const cookieStore = await cookies()
  const token = cookieStore.get(DEVICE_COOKIE_NAME)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getDeviceSecret())
    const deviceId = String(payload.deviceId || '')
    const userId = String(payload.userId || '')
    if (!deviceId || !userId) return null
    const deviceIdHash = hashDeviceId(deviceId)
    const record = await prisma.trustedDevice.findUnique({
      where: { userId_deviceIdHash: { userId, deviceIdHash } },
    })
    if (!record) return null
    if (record.revokedAt) return null
    if (record.expiresAt.getTime() < Date.now()) return null
    return { userId, deviceId }
  } catch {
    return null
  }
}

export async function clearDeviceCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(DEVICE_COOKIE_NAME)
}

export const DeviceCookie = {
  name: DEVICE_COOKIE_NAME,
  ttlDays: DEVICE_TTL_DAYS,
}


