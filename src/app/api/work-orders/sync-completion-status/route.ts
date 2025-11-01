/**
 * Sync Completion Status API
 * 
 * One-time endpoint to sync status and isCompleted fields across all work orders.
 * Useful for fixing data inconsistencies after migration or manual data changes.
 * 
 * ADMIN only endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromCookie } from '@/lib/auth/session'
import { syncCompletionStatus } from '@/lib/work-orders/sync-completion-status'
import { Role } from '@prisma/client'
import { logAudit } from '@/lib/audit'
import { AuditAction } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and authorization (ADMIN only)
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      )
    }

    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: '權限不足，僅管理員可使用此功能' },
        { status: 403 }
      )
    }

    // Get all work orders
    const workOrders = await prisma.unifiedWorkOrder.findMany({
      select: {
        id: true,
        status: true,
        isCompleted: true,
        customerName: true
      }
    })

    const results = {
      total: workOrders.length,
      synced: 0,
      skipped: 0,
      errors: [] as Array<{ id: string; error: string }>
    }

    // Process each work order
    for (const workOrder of workOrders) {
      try {
        const syncResult = syncCompletionStatus({
          currentStatus: workOrder.status,
          currentIsCompleted: workOrder.isCompleted,
          userId: session.userId
        })

        if (syncResult.needsSync) {
          await prisma.unifiedWorkOrder.update({
            where: { id: workOrder.id },
            data: syncResult.updates
          })
          results.synced++
        } else {
          results.skipped++
        }
      } catch (error) {
        results.errors.push({
          id: workOrder.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Audit log
    await logAudit({
      action: AuditAction.WORK_ORDER_UPDATED,
      userId: session.userId,
      phone: session.user.phoneE164,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        action: 'sync_completion_status',
        total: results.total,
        synced: results.synced,
        skipped: results.skipped,
        errors: results.errors.length
      }
    })

    return NextResponse.json({
      success: true,
      data: results,
      message: `同步完成：共處理 ${results.total} 筆，同步 ${results.synced} 筆，跳過 ${results.skipped} 筆${results.errors.length > 0 ? `，錯誤 ${results.errors.length} 筆` : ''}`
    })

  } catch (error) {
    console.error('[Sync Completion Status] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '同步失敗'
      },
      { status: 500 }
    )
  }
}

