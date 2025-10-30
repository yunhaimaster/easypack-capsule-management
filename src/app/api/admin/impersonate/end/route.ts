import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Role, AuditAction } from '@prisma/client'
import { endImpersonation, getImpersonationState } from '@/lib/auth/impersonation'
import { getUserContextFromRequest } from '@/lib/audit-context'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Get current impersonation state before ending it
    const impersonationState = await getImpersonationState()
    
    if (!impersonationState?.isImpersonating) {
      return NextResponse.json(
        { success: false, error: '目前沒有進行模擬身份' },
        { status: 400 }
      )
    }

    // Get current session context for audit logging (IP, user agent)
    const context = await getUserContextFromRequest(request)
    
    if (!context.userId) {
      return NextResponse.json(
        { success: false, error: '需要登入才能使用此功能' },
        { status: 401 }
      )
    }

    // Use the original admin user ID from impersonation state for permission checking
    const originalAdminUserId = impersonationState.originalUserId
    if (!originalAdminUserId) {
      return NextResponse.json(
        { success: false, error: '無法識別原始管理員身份' },
        { status: 400 }
      )
    }

    // Verify original admin user exists and has ADMIN role
    const adminUser = await prisma.user.findUnique({
      where: { id: originalAdminUserId },
      select: { id: true, role: true, phoneE164: true, nickname: true }
    })

    if (!adminUser || adminUser.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: '原始管理員身份無效' },
        { status: 403 }
      )
    }

    // Get target user info for audit logging
    const targetUser = impersonationState.impersonatedUserId 
      ? await prisma.user.findUnique({
          where: { id: impersonationState.impersonatedUserId },
          select: { id: true, phoneE164: true, role: true, nickname: true }
        })
      : null

    // End impersonation
    const success = await endImpersonation()

    if (!success) {
      return NextResponse.json(
        { success: false, error: '結束模擬身份失敗，請稍後重試' },
        { status: 500 }
      )
    }

    // Log impersonation end event
    await logAudit({
      action: AuditAction.IMPERSONATION_ENDED,
      userId: adminUser.id,
      phone: adminUser.phoneE164,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: {
        targetUserId: targetUser?.id || impersonationState.impersonatedUserId,
        targetUserPhone: targetUser?.phoneE164 || 'unknown',
        targetUserRole: targetUser?.role || 'unknown',
        adminPhone: adminUser.phoneE164,
        adminNickname: adminUser.nickname
      }
    })

    return NextResponse.json({
      success: true,
      message: '已結束模擬身份，恢復管理員身份',
      impersonation: {
        isImpersonating: false,
        originalUser: {
          id: adminUser.id,
          phone: adminUser.phoneE164,
          nickname: adminUser.nickname,
          role: adminUser.role
        }
      }
    })

  } catch (error) {
    console.error('[Impersonation End] Error:', error)
    return NextResponse.json(
      { success: false, error: '結束模擬身份時發生錯誤' },
      { status: 500 }
    )
  }
}
