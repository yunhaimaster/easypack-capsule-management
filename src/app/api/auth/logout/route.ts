import { NextRequest, NextResponse } from 'next/server'
import { clearDeviceCookie } from '@/lib/auth/device'
import { clearSessionCookie, getSessionFromCookie, revokeSession } from '@/lib/auth/session'
import { logAudit } from '@/lib/audit'
import { AuditAction } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.ip || null
    const userAgent = request.headers.get('user-agent') || null
    const session = await getSessionFromCookie()
    if (session) {
      await revokeSession(session.id)
      await logAudit({ action: AuditAction.LOGOUT, userId: session.userId, ip, userAgent })
    }
    await clearSessionCookie()
    await clearDeviceCookie()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('logout error', error)
    return NextResponse.json({ success: false, error: '登出失敗' }, { status: 500 })
  }
}


