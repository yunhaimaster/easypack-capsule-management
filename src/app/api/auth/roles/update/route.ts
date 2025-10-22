import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSessionFromCookie } from '@/lib/auth/session'
import { normalizeHongKongDefault } from '@/lib/auth/phone'
import { AuditAction, Role } from '@prisma/client'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BodySchema = z.object({
  userId: z.string().optional(),
  phone: z.string().optional(),
  role: z.nativeEnum(Role),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie()
    if (!session) return NextResponse.json({ success: false, error: '未授權' }, { status: 401 })

    const me = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!me || me.role !== Role.ADMIN) {
      return NextResponse.json({ success: false, error: '需要管理員權限' }, { status: 403 })
    }

    const json = await request.json()
    const parsed = BodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: '輸入格式不正確' }, { status: 400 })
    }

    const { userId, phone, role } = parsed.data
    if (!userId && !phone) {
      return NextResponse.json({ success: false, error: '需要 userId 或 phone' }, { status: 400 })
    }

    let target
    if (userId) {
      target = await prisma.user.findUnique({ where: { id: userId } })
    } else if (phone) {
      const e164 = normalizeHongKongDefault(phone)
      target = await prisma.user.findUnique({ where: { phoneE164: e164 } })
    }

    if (!target) return NextResponse.json({ success: false, error: '使用者不存在' }, { status: 404 })

    const updated = await prisma.user.update({ where: { id: target.id }, data: { role } })

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.ip || null
    const userAgent = request.headers.get('user-agent') || null
    await logAudit({ action: AuditAction.ROLE_UPDATED, userId: me.id, metadata: { targetId: updated.id, role: updated.role }, ip, userAgent })

    return NextResponse.json({ success: true, data: { id: updated.id, role: updated.role } })
  } catch (error) {
    console.error('roles/update error', error)
    return NextResponse.json({ success: false, error: '更新角色失敗' }, { status: 500 })
  }
}


