/**
 * Toggle Work Order Boolean Fields API
 * 
 * Supports quick toggle actions for:
 * - productionStarted
 * - productionMaterialsReady
 * - packagingMaterialsReady
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSessionFromCookie } from '@/lib/auth/session'
import { logAudit } from '@/lib/audit'
import { AuditAction } from '@prisma/client'
import { z } from 'zod'
import { prepareCompletionSync } from '@/lib/work-orders/sync-completion-status'

const toggleSchema = z.object({
  field: z.enum([
    'productionStarted', 
    'productionMaterialsReady', 
    'packagingMaterialsReady', 
    'isCompleted',
    'isCustomerServiceVip',
    'isBossVip',
    'isUrgent'
  ]),
  value: z.boolean()
})

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const parsed = toggleSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: '無效的請求參數' },
        { status: 400 }
      )
    }

    const { field, value } = parsed.data
    const params = await context.params
    const workOrderId = params.id

    // Get current work order to check existing status
    const existingWorkOrder = await prisma.unifiedWorkOrder.findUnique({
      where: { id: workOrderId },
      select: { 
        id: true,
        status: true,
        isCompleted: true
      }
    })

    if (!existingWorkOrder) {
      return NextResponse.json(
        { success: false, error: '工作單不存在' },
        { status: 404 }
      )
    }

    // Prepare update data
    let updateData: any = {
      [field]: value
    }

    // Auto-trigger COMPLETED status when isCompleted is checked
    // Only set status if it's not already COMPLETED to avoid invalid transitions
    if (field === 'isCompleted' && value === true && existingWorkOrder.status !== 'COMPLETED') {
      updateData.status = 'COMPLETED'
      updateData.statusUpdatedAt = new Date()
      updateData.statusUpdatedBy = session.userId
    }
    
    // If unchecking isCompleted and status is COMPLETED, don't change status
    // (COMPLETED is a final state - let user use status change menu if they want to change it)
    // Just update the isCompleted flag

    // Sync completion status to ensure consistency
    updateData = prepareCompletionSync(updateData, existingWorkOrder, session.userId)

    // Update work order
    const updatedWorkOrder = await prisma.unifiedWorkOrder.update({
      where: { id: workOrderId },
      data: updateData,
      include: {
        personInCharge: {
          select: {
            id: true,
            nickname: true,
            phoneE164: true
          }
        },
        capsulationOrder: {
          select: {
            id: true
          }
        }
      }
    })

    // Audit logging
    await logAudit({
      action: AuditAction.WORK_ORDER_UPDATED,
      userId: session.userId,
      phone: session.user.phoneE164,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        workOrderId,
        customerName: updatedWorkOrder.customerName,
        personInChargeName: updatedWorkOrder.personInCharge?.nickname || updatedWorkOrder.personInCharge?.phoneE164 || '未指定',
        field,
        newValue: value
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedWorkOrder
    })

  } catch (error) {
    console.error('[Toggle API] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '更新失敗' 
      },
      { status: 500 }
    )
  }
}

