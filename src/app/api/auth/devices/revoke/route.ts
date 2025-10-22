import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionFromCookie } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { hashDeviceId } from '@/lib/auth/device'
import { logAudit } from '@/lib/audit'
import { AuditAction } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BodySchema = z.object({ deviceId: z.string() })

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie()
    if (!session) return NextResponse.json({ success: false, error: '未授權' }, { status: 401 })

    const body = await request.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: '輸入格式不正確' }, { status: 400 })

    const deviceIdHash = hashDeviceId(parsed.data.deviceId)
    await prisma.trustedDevice.update({
      where: { userId_deviceIdHash: { userId: session.userId, deviceIdHash } },
      data: { revokedAt: new Date() },
    })

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const userAgent = request.headers.get('user-agent') || null
    await logAudit({ action: AuditAction.DEVICE_TRUST_REVOKED, userId: session.userId, ip, userAgent })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('devices/revoke error', error)
    return NextResponse.json({ success: false, error: '撤銷失敗' }, { status: 500 })
  }
}


