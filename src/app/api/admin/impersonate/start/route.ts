import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Role, AuditAction } from '@prisma/client'
import { startImpersonation } from '@/lib/auth/impersonation'
import { getUserContextFromRequest } from '@/lib/audit-context'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Get admin user context for audit logging
    const context = await getUserContextFromRequest(request)
    
    if (!context.userId) {
      return NextResponse.json(
        { success: false, error: '需要登入才能使用此功能' },
        { status: 401 }
      )
    }

    // Verify admin user exists and has ADMIN role
    const adminUser = await prisma.user.findUnique({
      where: { id: context.userId },
      select: { id: true, role: true, phoneE164: true, nickname: true }
    })

    if (!adminUser || adminUser.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: '需要管理員權限才能模擬其他用戶' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { targetUserId } = body

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json(
        { success: false, error: '請提供有效的目標用戶ID' },
        { status: 400 }
      )
    }

    // Verify target user exists and is not ADMIN
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, phoneE164: true, role: true, nickname: true }
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: '目標用戶不存在' },
        { status: 404 }
      )
    }

    if (targetUser.role === Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: '不能模擬其他管理員' },
        { status: 400 }
      )
    }

    // Start impersonation
    const impersonationState = await startImpersonation(adminUser.id, targetUser.id)

    if (!impersonationState) {
      return NextResponse.json(
        { success: false, error: '模擬身份失敗，請稍後重試' },
        { status: 500 }
      )
    }

    // Log impersonation start event
    await logAudit({
      action: AuditAction.IMPERSONATION_STARTED,
      userId: adminUser.id,
      phone: adminUser.phoneE164,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: {
        targetUserId: targetUser.id,
        targetUserPhone: targetUser.phoneE164,
        targetUserRole: targetUser.role,
        adminPhone: adminUser.phoneE164,
        adminNickname: adminUser.nickname
      }
    })

    return NextResponse.json({
      success: true,
      message: `已開始模擬用戶 ${targetUser.phoneE164} (${targetUser.role})`,
      impersonation: {
        isImpersonating: true,
        originalUser: {
          id: adminUser.id,
          phone: adminUser.phoneE164,
          nickname: adminUser.nickname,
          role: adminUser.role
        },
        impersonatedUser: {
          id: targetUser.id,
          phone: targetUser.phoneE164,
          nickname: targetUser.nickname,
          role: targetUser.role
        }
      }
    })

  } catch (error) {
    console.error('[Impersonation Start] Error:', error)
    return NextResponse.json(
      { success: false, error: '模擬身份時發生錯誤' },
      { status: 500 }
    )
  }
}
