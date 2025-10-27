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

    // Prepare update data
    const updateData: any = {
      [field]: value
    }

    // Auto-trigger COMPLETED status when isCompleted is checked
    if (field === 'isCompleted' && value === true) {
      updateData.status = 'COMPLETED'
      updateData.statusUpdatedAt = new Date()
      updateData.statusUpdatedBy = session.userId
    }

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

