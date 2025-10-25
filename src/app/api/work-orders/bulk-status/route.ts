/**
 * Bulk Update Work Order Status API Route
 * 
 * PATCH /api/work-orders/bulk-status
 * 
 * Updates the status of multiple work orders at once
 * - Requires authentication
 * - Validates input with Zod
 * - Audit logs each status change
 * - Returns count of updated items
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getUserContextFromRequest } from '@/lib/audit-context'
import { logAudit } from '@/lib/audit'
import { AuditAction, WorkOrderStatus } from '@prisma/client'

const bulkStatusUpdateSchema = z.object({
  ids: z.array(z.string().uuid('Invalid work order ID')).min(1, 'Must provide at least one ID'),
  status: z.nativeEnum(WorkOrderStatus, { errorMap: () => ({ message: 'Invalid status' }) })
})

export async function PATCH(request: NextRequest) {
  try {
    // Get user context for authentication and audit
    const context = await getUserContextFromRequest(request)
    
    if (!context.userId) {
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = bulkStatusUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: '無效的請求數據', details: validation.error },
        { status: 400 }
      )
    }

    const { ids, status } = validation.data

    // Update work orders in transaction
    let updated = 0
    let failed = 0
    const errors: Array<{ id: string, error: string }> = []

    for (const id of ids) {
      try {
        // Check if work order exists
        const workOrder = await prisma.unifiedWorkOrder.findUnique({
          where: { id },
          select: { id: true, jobNumber: true, customerName: true, status: true }
        })

        if (!workOrder) {
          failed++
          errors.push({ id, error: '工作單不存在' })
          continue
        }

        // Update the status
        await prisma.unifiedWorkOrder.update({
          where: { id },
          data: {
            status,
            statusUpdatedAt: new Date(),
            statusUpdatedBy: context.userId
          }
        })

        // Audit log the status change
        await logAudit({
          action: AuditAction.ORDER_UPDATED,
          userId: context.userId,
          phone: context.phone,
          ip: context.ip,
          userAgent: context.userAgent,
          metadata: {
            workOrderId: id,
            jobNumber: workOrder.jobNumber,
            customerName: workOrder.customerName,
            updateType: 'bulk_status_change',
            oldStatus: workOrder.status,
            newStatus: status
          }
        })

        updated++
      } catch (error: unknown) {
        console.error(`[Bulk Status Update] Failed to update work order ${id}:`, error)
        failed++
        const message = error instanceof Error ? error.message : 'Unknown error'
        errors.push({ id, error: message })
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      failed,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: unknown) {
    console.error('[Bulk Status Update] Error:', error)
    const message = error instanceof Error ? error.message : '狀態更新失敗'
    
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

