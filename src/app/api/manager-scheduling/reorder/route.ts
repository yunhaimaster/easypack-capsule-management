/**
 * Manager Scheduling Table API - Reorder Operations
 * 
 * PATCH /api/manager-scheduling/reorder - Bulk update priorities for drag-drop reordering
 */

import { NextRequest, NextResponse } from 'next/server'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { reorderSchedulingSchema } from '@/lib/validations/manager-scheduling-schemas'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/middleware/manager-scheduling-auth'
import { logAudit } from '@/lib/audit'
import { getUserContextFromRequest } from '@/lib/audit-context'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/manager-scheduling/reorder
 * 
 * Bulk update priorities for drag-drop reordering.
 * Updates all priorities atomically in a transaction.
 * 
 * Accessible by MANAGER and ADMIN only (UPDATE permission).
 * 
 * Body:
 * - updates: Array<{ id: string, priority: number }>
 * 
 * Returns:
 * - success: boolean
 * - data: { updated: number }
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authentication check
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      )
    }

    // Authorization check - UPDATE permission required
    if (!hasPermission(session.user.role, 'UPDATE')) {
      return NextResponse.json(
        { success: false, error: '權限不足' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = reorderSchedulingSchema.parse(body)

    // Validate priorities are sequential and no duplicates
    const priorities = validatedData.updates.map(u => u.priority).sort((a, b) => a - b)
    const expectedPriorities = Array.from({ length: priorities.length }, (_, i) => i + 1)
    
    if (JSON.stringify(priorities) !== JSON.stringify(expectedPriorities)) {
      return NextResponse.json(
        { success: false, error: '次序必須是連續的整數（1, 2, 3...），且不能重複' },
        { status: 400 }
      )
    }

    // Update all priorities in transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatePromises = validatedData.updates.map(update =>
        tx.managerSchedulingEntry.update({
          where: { id: update.id },
          data: { priority: update.priority }
        })
      )

      await Promise.all(updatePromises)
      return updatePromises.length
    })

    // Get audit context
    const auditContext = await getUserContextFromRequest(request)

    // Log audit action
    await logAudit({
      action: AuditAction.SCHEDULING_REORDERED,
      userId: session.userId,
      phone: session.user.phoneE164,
      ip: auditContext.ip,
      userAgent: auditContext.userAgent,
      metadata: {
        entriesCount: result,
        updates: validatedData.updates.map(u => ({ id: u.id, priority: u.priority }))
      }
    })

    // Return success
    return NextResponse.json(
      {
        success: true,
        data: { updated: result }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] PATCH /api/manager-scheduling/reorder error:', error)
    
    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        {
          success: false,
          error: '驗證失敗',
          details: error
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '重新排序失敗'
      },
      { status: 500 }
    )
  }
}

