/**
 * Bulk Delete Work Orders API Route
 * 
 * DELETE /api/work-orders/bulk-delete
 * 
 * Deletes multiple work orders at once
 * - Requires authentication
 * - Validates input with Zod
 * - Audit logs each deletion
 * - Returns count of deleted items
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getUserContextFromRequest } from '@/lib/audit-context'
import { logAudit } from '@/lib/audit'
import { AuditAction } from '@prisma/client'

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().cuid('Invalid work order ID')).min(1, 'Must provide at least one ID')
})

export async function DELETE(request: NextRequest) {
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
    const validation = bulkDeleteSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: '無效的請求數據', details: validation.error },
        { status: 400 }
      )
    }

    const { ids } = validation.data

    // Delete work orders in transaction
    let deleted = 0
    let failed = 0
    const errors: Array<{ id: string, error: string }> = []

    for (const id of ids) {
      try {
        // Check if work order exists
        const workOrder = await prisma.unifiedWorkOrder.findUnique({
          where: { id },
          select: { id: true, jobNumber: true, customerName: true }
        })

        if (!workOrder) {
          failed++
          errors.push({ id, error: '工作單不存在' })
          continue
        }

        // Delete the work order (cascade will handle related records)
        await prisma.unifiedWorkOrder.delete({
          where: { id }
        })

        // Audit log the deletion
        await logAudit({
          action: AuditAction.ORDER_DELETED,
          userId: context.userId,
          phone: context.phone,
          ip: context.ip,
          userAgent: context.userAgent,
          metadata: {
            workOrderId: id,
            jobNumber: workOrder.jobNumber,
            customerName: workOrder.customerName,
            deletionType: 'bulk'
          }
        })

        deleted++
      } catch (error: unknown) {
        console.error(`[Bulk Delete] Failed to delete work order ${id}:`, error)
        failed++
        const message = error instanceof Error ? error.message : 'Unknown error'
        errors.push({ id, error: message })
      }
    }

    return NextResponse.json({
      success: true,
      deleted,
      failed,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: unknown) {
    console.error('[Bulk Delete] Error:', error)
    const message = error instanceof Error ? error.message : '刪除失敗'
    
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

