import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromCookie } from '@/lib/auth/session'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Revoke session or device (Admin and Manager)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromCookie()
    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
      return NextResponse.json({ success: false, error: '需要管理權限' }, { status: 403 })
    }

    const { id } = await params
    const url = new URL(request.url)
    const type = url.searchParams.get('type') // 'session' or 'device'

    if (type === 'session') {
      await prisma.session.update({
        where: { id },
        data: { revokedAt: new Date() }
      })
    } else if (type === 'device') {
      await prisma.trustedDevice.update({
        where: { id },
        data: { revokedAt: new Date() }
      })
    } else {
      return NextResponse.json({ success: false, error: '類型無效' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin] Revoke device/session error:', error)
    return NextResponse.json({ success: false, error: '撤銷失敗' }, { status: 500 })
  }
}

