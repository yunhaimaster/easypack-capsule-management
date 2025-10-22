import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromCookie } from '@/lib/auth/session'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Get all devices/sessions (Admin and Manager can view)
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie()
    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
      return NextResponse.json({ success: false, error: '需要管理權限' }, { status: 403 })
    }

    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    // Get active sessions
    const sessions = await prisma.session.findMany({
      where: {
        ...(userId ? { userId } : {}),
        revokedAt: null,
        expiresAt: { gte: new Date() }
      },
      include: {
        user: {
          select: {
            id: true,
            phoneE164: true,
            role: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get trusted devices
    const devices = await prisma.trustedDevice.findMany({
      where: {
        ...(userId ? { userId } : {}),
        revokedAt: null,
        expiresAt: { gte: new Date() }
      },
      include: {
        user: {
          select: {
            id: true,
            phoneE164: true,
            role: true,
          }
        }
      },
      orderBy: { lastSeenAt: 'desc' }
    })

    return NextResponse.json({ success: true, sessions, devices })
  } catch (error) {
    console.error('[Admin] Get devices error:', error)
    return NextResponse.json({ success: false, error: '獲取設備列表失敗' }, { status: 500 })
  }
}

