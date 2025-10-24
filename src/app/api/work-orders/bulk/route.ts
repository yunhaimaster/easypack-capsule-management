/**
 * Unified Work Orders API - Bulk Operations
 * 
 * POST /api/work-orders/bulk - Bulk update multiple work orders
 */

import { NextRequest, NextResponse } from 'next/server'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { bulkUpdateSchema } from '@/lib/validations/work-order-schemas'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/middleware/work-order-auth'
import { logAudit } from '@/lib/audit'
import { getUserContextFromRequest } from '@/lib/audit-context'
import { VALID_STATUS_TRANSITIONS } from '@/types/work-order'

export const dynamic = 'force-dynamic'

/**
 * POST /api/work-orders/bulk
 * 
 * Bulk update multiple work orders at once.
 * 
 * Accessible by MANAGER+ (managers and admins only)
 * 
 * Supported bulk updates:
 * - personInChargeId: Reassign person in charge
 * - status: Change status (validates all transitions)
 * - workType: Change work type
 * - expectedCompletionDate: Update completion date
 * 
 * Transaction Strategy: All-or-nothing
 * - If ANY update fails, entire operation rolls back
 * - Returns detailed error information for debugging
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      )
    }

    // Authorization check - BULK_UPDATE permission required
    if (!hasPermission(session.user.role, 'BULK_UPDATE')) {
      return NextResponse.json(
        { success: false, error: '權限不足' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = bulkUpdateSchema.parse(body)

    const { workOrderIds, updates } = validatedData

    // Pre-check: Verify all work orders exist
    const existingWorkOrders = await prisma.unifiedWorkOrder.findMany({
      where: { id: { in: workOrderIds } },
      select: { 
        id: true, 
        jobNumber: true,
        status: true 
      }
    })

    // Check if any IDs are missing
    if (existingWorkOrders.length !== workOrderIds.length) {
      const foundIds = new Set(existingWorkOrders.map(wo => wo.id))
      const missingIds = workOrderIds.filter(id => !foundIds.has(id))

      return NextResponse.json(
        {
          success: false,
          error: '部分工作單不存在',
          details: {
            missingIds,
            found: existingWorkOrders.length,
            requested: workOrderIds.length
          }
        },
        { status: 400 }
      )
    }

    // If status update, validate ALL transitions before starting transaction
    if (updates.status) {
      const invalidTransitions: Array<{ id: string; jobNumber: string; currentStatus: string }> = []

      for (const workOrder of existingWorkOrders) {
        const currentStatus = workOrder.status
        const newStatus = updates.status

        const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus]
        if (!validTransitions.includes(newStatus)) {
          invalidTransitions.push({
            id: workOrder.id,
            jobNumber: workOrder.jobNumber,
            currentStatus
          })
        }
      }

      if (invalidTransitions.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: '部分工作單無法進行此狀態轉換',
            details: {
              attemptedStatus: updates.status,
              invalidTransitions
            }
          },
          { status: 400 }
        )
      }
    }

    // If personInChargeId is being updated, verify it exists
    if (updates.personInChargeId) {
      const personExists = await prisma.user.findUnique({
        where: { id: updates.personInChargeId },
        select: { id: true }
      })

      if (!personExists) {
        return NextResponse.json(
          { success: false, error: '負責人不存在' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}
    
    if (updates.personInChargeId !== undefined) {
      updateData.personInChargeId = updates.personInChargeId
    }
    if (updates.workType !== undefined) {
      updateData.workType = updates.workType
    }
    if (updates.expectedCompletionDate !== undefined) {
      updateData.expectedCompletionDate = updates.expectedCompletionDate 
        ? new Date(updates.expectedCompletionDate) 
        : null
    }
    if (updates.status !== undefined) {
      updateData.status = updates.status
      updateData.statusUpdatedAt = new Date()
      updateData.statusUpdatedBy = session.userId
    }

    // Execute bulk update in transaction (all-or-nothing)
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.unifiedWorkOrder.updateMany({
        where: { id: { in: workOrderIds } },
        data: updateData
      })

      return updated
    })

    // Get audit context
    const auditContext = await getUserContextFromRequest(request)

    // Log audit action
    await logAudit({
      action: AuditAction.WORK_ORDER_BULK_UPDATED,
      userId: session.userId,
      phone: session.user.phoneE164,
      ip: auditContext.ip,
      userAgent: auditContext.userAgent,
      metadata: {
        workOrderCount: result.count,
        workOrderIds,
        updates: {
          personInChargeId: updates.personInChargeId ? 'updated' : undefined,
          status: updates.status || undefined,
          workType: updates.workType || undefined,
          expectedCompletionDate: updates.expectedCompletionDate ? 'updated' : undefined
        }
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          updated: result.count,
          failed: 0,
          errors: []
        },
        message: `成功更新 ${result.count} 個工作單`
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] POST /api/work-orders/bulk error:', error)
    
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

    // Transaction failed - return partial error details
    return NextResponse.json(
      {
        success: false,
        updated: 0,
        failed: 0, // Unknown count since transaction rolled back
        errors: [{
          error: error instanceof Error ? error.message : '批量更新失敗'
        }]
      },
      { status: 500 }
    )
  }
}

