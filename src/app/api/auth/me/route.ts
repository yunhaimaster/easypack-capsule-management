import { NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Returns current user info if authenticated
export async function GET() {
  try {
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, phoneE164: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        phone: user.phoneE164,
        role: user.role,
        isAdmin: user.role === Role.ADMIN,
        isManager: user.role === Role.MANAGER || user.role === Role.ADMIN,
      }
    })
  } catch (error) {
    console.error('[Auth] /api/auth/me error:', error)
    return NextResponse.json({ success: false, authenticated: false }, { status: 500 })
  }
}

