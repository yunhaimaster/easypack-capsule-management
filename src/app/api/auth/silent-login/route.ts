import { NextRequest, NextResponse } from 'next/server'
import { verifyTrustedDevice } from '@/lib/auth/device'
import { createSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { AuditAction } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const userAgent = request.headers.get('user-agent') || null

    const trusted = await verifyTrustedDevice()
    if (!trusted) {
      return NextResponse.json({ success: false, error: '無有效的受信任裝置' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: trusted.userId } })
    if (!user) {
      return NextResponse.json({ success: false, error: '使用者不存在' }, { status: 401 })
    }

    await createSession(user.id, { ip, userAgent })
    await logAudit({ action: AuditAction.SESSION_REFRESH, userId: user.id, ip, userAgent })
    return NextResponse.json({ success: true, data: { role: user.role } })
  } catch (error) {
    console.error('silent-login error', error)
    return NextResponse.json({ success: false, error: '自動登入失敗' }, { status: 500 })
  }
}


