import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

const IMPERSONATION_COOKIE_NAME = 'impersonation'
const SESSION_SECRET = process.env.SESSION_SECRET

if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is not set')
}

function getSessionSecret(): Uint8Array {
  return new TextEncoder().encode(SESSION_SECRET)
}

export interface ImpersonationState {
  isImpersonating: boolean
  originalUserId?: string
  impersonatedUserId?: string
  impersonatedUser?: {
    id: string
    phone: string
    role: Role
    nickname?: string | null
  }
}

/**
 * Start impersonating a user
 * @param adminUserId - ID of the admin user starting impersonation
 * @param targetUserId - ID of the user to impersonate
 * @returns Impersonation state or null if failed
 */
export async function startImpersonation(
  adminUserId: string,
  targetUserId: string
): Promise<ImpersonationState | null> {
  try {
    // Verify admin user exists and is ADMIN
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { id: true, role: true }
    })

    if (!adminUser || adminUser.role !== Role.ADMIN) {
      console.error('[Impersonation] Admin user not found or not ADMIN role')
      return null
    }

    // Verify target user exists and is not ADMIN
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, phoneE164: true, role: true, nickname: true }
    })

    if (!targetUser) {
      console.error('[Impersonation] Target user not found')
      return null
    }

    if (targetUser.role === Role.ADMIN) {
      console.error('[Impersonation] Cannot impersonate another ADMIN')
      return null
    }

    // Create impersonation JWT
    const impersonationToken = await new SignJWT({
      adminUserId,
      targetUserId,
      type: 'impersonation'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h') // Impersonation expires in 24 hours
      .sign(getSessionSecret())

    // Set impersonation cookie
    const cookieStore = await cookies()
    cookieStore.set(IMPERSONATION_COOKIE_NAME, impersonationToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })

    return {
      isImpersonating: true,
      originalUserId: adminUserId,
      impersonatedUserId: targetUserId,
      impersonatedUser: {
        id: targetUser.id,
        phone: targetUser.phoneE164,
        role: targetUser.role,
        nickname: targetUser.nickname
      }
    }
  } catch (error) {
    console.error('[Impersonation] Start failed:', error)
    return null
  }
}

/**
 * End impersonation and restore original admin session
 * @returns Success status
 */
export async function endImpersonation(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(IMPERSONATION_COOKIE_NAME)
    return true
  } catch (error) {
    console.error('[Impersonation] End failed:', error)
    return false
  }
}

/**
 * Get current impersonation state from cookie
 * @returns Impersonation state or null if not impersonating
 */
export async function getImpersonationState(): Promise<ImpersonationState | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value

    if (!token) {
      return { isImpersonating: false }
    }

    // Verify impersonation JWT
    const { payload } = await jwtVerify(token, getSessionSecret())
    
    if (payload.type !== 'impersonation') {
      console.error('[Impersonation] Invalid token type')
      return { isImpersonating: false }
    }

    const adminUserId = String(payload.adminUserId || '')
    const targetUserId = String(payload.targetUserId || '')

    if (!adminUserId || !targetUserId) {
      console.error('[Impersonation] Missing user IDs in token')
      return { isImpersonating: false }
    }

    // Get target user details
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, phoneE164: true, role: true, nickname: true }
    })

    if (!targetUser) {
      console.error('[Impersonation] Target user not found')
      return { isImpersonating: false }
    }

    return {
      isImpersonating: true,
      originalUserId: adminUserId,
      impersonatedUserId: targetUserId,
      impersonatedUser: {
        id: targetUser.id,
        phone: targetUser.phoneE164,
        role: targetUser.role,
        nickname: targetUser.nickname
      }
    }
  } catch (error) {
    console.error('[Impersonation] Get state failed:', error)
    return { isImpersonating: false }
  }
}

/**
 * Check if current session is impersonating
 * @returns boolean
 */
export async function isImpersonating(): Promise<boolean> {
  const state = await getImpersonationState()
  return state?.isImpersonating || false
}
