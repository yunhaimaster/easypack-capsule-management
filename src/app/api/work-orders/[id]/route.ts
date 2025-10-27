/**
 * Unified Work Orders API - Individual Work Order Operations
 * 
 * GET /api/work-orders/[id] - Get single work order with full details
 * PATCH /api/work-orders/[id] - Update work order
 * DELETE /api/work-orders/[id] - Delete work order (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { updateWorkOrderSchema } from '@/lib/validations/work-order-schemas'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/middleware/work-order-auth'
import { logAudit } from '@/lib/audit'
import { getUserContextFromRequest } from '@/lib/audit-context'
import { VALID_STATUS_TRANSITIONS } from '@/types/work-order'

export const dynamic = 'force-dynamic'

/**
 * GET /api/work-orders/[id]
 * 
 * Get detailed work order information including:
 * - Full work order data
 * - Person in charge details
 * - Capsulation order (if exists)
 * - Ingredients (if capsulation order)
 * - Worklogs (if capsulation order)
 * 
 * Accessible by EMPLOYEE+ (all authenticated users)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      )
    }

    // Authorization check
    if (!hasPermission(session.user.role, 'READ')) {
      return NextResponse.json(
        { success: false, error: '權限不足' },
        { status: 403 }
      )
    }

    const { id } = await context.params

    // Fetch work order with all relations
    const workOrder = await prisma.unifiedWorkOrder.findUnique({
      where: { id },
      include: {
        personInCharge: {
          select: {
            id: true,
            nickname: true,
            phoneE164: true
          }
        },
        capsulationOrder: {
          include: {
            customerService: {
              select: {
                id: true,
                nickname: true,
                phoneE164: true
              }
            },
            ingredients: {
              orderBy: { materialName: 'asc' }
            },
            worklogs: {
              orderBy: { workDate: 'desc' }
            }
          }
        }
      }
    })

    if (!workOrder) {
      return NextResponse.json(
        { success: false, error: '工作單不存在' },
        { status: 404 }
      )
    }

    // Get audit context
    const auditContext = await getUserContextFromRequest(request)

    // Log view action
    await logAudit({
      action: AuditAction.WORK_ORDER_VIEWED,
      userId: session.userId,
      phone: session.user.phoneE164,
      ip: auditContext.ip,
      userAgent: auditContext.userAgent,
      metadata: {
        workOrderId: workOrder.id,
        jobNumber: workOrder.jobNumber
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: workOrder
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60'
        }
      }
    )
  } catch (error) {
    console.error('[API] GET /api/work-orders/[id] error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '查詢工作單失敗'
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/work-orders/[id]
 * 
 * Update work order (and optionally capsulation order).
 * 
 * Accessible by MANAGER+ (managers and admins only)
 * 
 * Special handling:
 * - Status updates: Validates state transitions
 * - Auto-sets statusUpdatedAt and statusUpdatedBy on status change
 * - Capsulation ingredients: Deletes all + recreates if provided
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateWorkOrderSchema.parse(body)

    // Check if work order exists
    const existingWorkOrder = await prisma.unifiedWorkOrder.findUnique({
      where: { id },
      select: { 
        id: true, 
        status: true, 
        jobNumber: true,
        capsulationOrder: {
          select: { id: true }
        }
      }
    })

    if (!existingWorkOrder) {
      return NextResponse.json(
        { success: false, error: '工作單不存在' },
        { status: 404 }
      )
    }

    // Validate status transition if status is being updated
    if (validatedData.status !== undefined && validatedData.status !== existingWorkOrder.status) {
      const currentStatus = existingWorkOrder.status
      const newStatus = validatedData.status

      // If current status is null, allow any transition
      if (currentStatus && newStatus) {
        const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus]
        if (!validTransitions.includes(newStatus)) {
          return NextResponse.json(
            { 
              success: false, 
              error: '無效的狀態轉換',
              details: {
                currentStatus,
                attemptedStatus: newStatus,
                validTransitions
              }
            },
            { status: 400 }
          )
        }
      }
    }

    // If jobNumber is being updated, check uniqueness
    if (validatedData.jobNumber && validatedData.jobNumber !== existingWorkOrder.jobNumber) {
      const duplicate = await prisma.unifiedWorkOrder.findUnique({
        where: { jobNumber: validatedData.jobNumber },
        select: { id: true }
      })

      if (duplicate && duplicate.id !== id) {
        return NextResponse.json(
          { success: false, error: 'JOB標號已存在' },
          { status: 400 }
        )
      }
    }

    // If personInChargeId is being updated, verify it exists
    if (validatedData.personInChargeId) {
      const personExists = await prisma.user.findUnique({
        where: { id: validatedData.personInChargeId },
        select: { id: true }
      })

      if (!personExists) {
        return NextResponse.json(
          { success: false, error: '負責人不存在' },
          { status: 400 }
        )
      }
    }

    // If capsulation order customerServiceId is being updated, verify it exists
    if (validatedData.capsulationOrder?.customerServiceId) {
      const customerServiceExists = await prisma.user.findUnique({
        where: { id: validatedData.capsulationOrder.customerServiceId },
        select: { id: true }
      })

      if (!customerServiceExists) {
        return NextResponse.json(
          { success: false, error: '客服不存在' },
          { status: 400 }
        )
      }
    }

    // Update work order in transaction
    const updatedWorkOrder = await prisma.$transaction(async (tx) => {
      // Prepare unified work order update data
      const workOrderUpdateData: Record<string, unknown> = {}

      // Copy validated fields
      if (validatedData.jobNumber !== undefined) workOrderUpdateData.jobNumber = validatedData.jobNumber
      if (validatedData.customerName !== undefined) workOrderUpdateData.customerName = validatedData.customerName
      if (validatedData.personInChargeId !== undefined) workOrderUpdateData.personInChargeId = validatedData.personInChargeId
      if (validatedData.workType !== undefined) workOrderUpdateData.workType = validatedData.workType
      if (validatedData.workDescription !== undefined) workOrderUpdateData.workDescription = validatedData.workDescription
      
      // VIP標記
      if (validatedData.isCustomerServiceVip !== undefined) workOrderUpdateData.isCustomerServiceVip = validatedData.isCustomerServiceVip
      if (validatedData.isBossVip !== undefined) workOrderUpdateData.isBossVip = validatedData.isBossVip
      
      // 物料到齊狀態
      if (validatedData.expectedProductionMaterialsDate !== undefined) {
        workOrderUpdateData.expectedProductionMaterialsDate = validatedData.expectedProductionMaterialsDate ? new Date(validatedData.expectedProductionMaterialsDate) : null
      }
      if (validatedData.expectedPackagingMaterialsDate !== undefined) {
        workOrderUpdateData.expectedPackagingMaterialsDate = validatedData.expectedPackagingMaterialsDate ? new Date(validatedData.expectedPackagingMaterialsDate) : null
      }
      if (validatedData.productionMaterialsReady !== undefined) workOrderUpdateData.productionMaterialsReady = validatedData.productionMaterialsReady
      if (validatedData.packagingMaterialsReady !== undefined) workOrderUpdateData.packagingMaterialsReady = validatedData.packagingMaterialsReady
      
      // 數量
      if (validatedData.productionQuantity !== undefined) workOrderUpdateData.productionQuantity = validatedData.productionQuantity
      if (validatedData.packagingQuantity !== undefined) workOrderUpdateData.packagingQuantity = validatedData.packagingQuantity
      
      // 交貨期
      if (validatedData.requestedDeliveryDate !== undefined) {
        workOrderUpdateData.requestedDeliveryDate = validatedData.requestedDeliveryDate ? new Date(validatedData.requestedDeliveryDate) : null
      }
      if (validatedData.internalExpectedDate !== undefined) {
        workOrderUpdateData.internalExpectedDate = validatedData.internalExpectedDate ? new Date(validatedData.internalExpectedDate) : null
      }
      
      // 狀態標記
      if (validatedData.isUrgent !== undefined) workOrderUpdateData.isUrgent = validatedData.isUrgent
      if (validatedData.productionStarted !== undefined) workOrderUpdateData.productionStarted = validatedData.productionStarted
      if (validatedData.isCompleted !== undefined) workOrderUpdateData.isCompleted = validatedData.isCompleted

      // If status is being updated, set metadata
      if (validatedData.status) {
        workOrderUpdateData.status = validatedData.status
        workOrderUpdateData.statusUpdatedAt = new Date()
        workOrderUpdateData.statusUpdatedBy = session.userId
      }

      // Update unified work order
      const updated = await tx.unifiedWorkOrder.update({
        where: { id },
        data: workOrderUpdateData,
        include: {
          personInCharge: {
            select: {
              id: true,
              nickname: true,
              phoneE164: true
            }
          }
        }
      })

      // Update capsulation order if provided
      if (validatedData.capsulationOrder && existingWorkOrder.capsulationOrder) {
        const capsulationData = validatedData.capsulationOrder
        const capsulationUpdateData: Record<string, unknown> = {}

        if (capsulationData.productName !== undefined) capsulationUpdateData.productName = capsulationData.productName
        if (capsulationData.productionQuantity !== undefined) capsulationUpdateData.productionQuantity = capsulationData.productionQuantity
        if (capsulationData.completionDate !== undefined) {
          capsulationUpdateData.completionDate = capsulationData.completionDate ? new Date(capsulationData.completionDate) : null
        }
        if (capsulationData.capsuleColor !== undefined) capsulationUpdateData.capsuleColor = capsulationData.capsuleColor
        if (capsulationData.capsuleSize !== undefined) capsulationUpdateData.capsuleSize = capsulationData.capsuleSize
        if (capsulationData.capsuleType !== undefined) capsulationUpdateData.capsuleType = capsulationData.capsuleType
        if (capsulationData.customerServiceId !== undefined) capsulationUpdateData.customerServiceId = capsulationData.customerServiceId

        await tx.capsulationOrder.update({
          where: { workOrderId: id },
          data: capsulationUpdateData
        })

        // If ingredients are provided, delete all and recreate
        if (capsulationData.ingredients && capsulationData.ingredients.length > 0) {
          // Delete existing ingredients
          await tx.capsulationIngredient.deleteMany({
            where: { orderId: existingWorkOrder.capsulationOrder.id }
          })

          // Create new ingredients
          await tx.capsulationIngredient.createMany({
            data: capsulationData.ingredients.map(ing => ({
              orderId: existingWorkOrder.capsulationOrder!.id,
              materialName: ing.materialName,
              unitContentMg: ing.unitContentMg,
              isCustomerProvided: ing.isCustomerProvided,
              isCustomerSupplied: ing.isCustomerSupplied
            }))
          })
        }
      }

      return updated
    })

    // Get audit context
    const auditContext = await getUserContextFromRequest(request)

    // Log audit action
    await logAudit({
      action: AuditAction.WORK_ORDER_UPDATED,
      userId: session.userId,
      phone: session.user.phoneE164,
      ip: auditContext.ip,
      userAgent: auditContext.userAgent,
      metadata: {
        workOrderId: updatedWorkOrder.id,
        jobNumber: updatedWorkOrder.jobNumber,
        statusChanged: validatedData.status ? {
          from: existingWorkOrder.status,
          to: validatedData.status
        } : undefined
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: updatedWorkOrder
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] PATCH /api/work-orders/[id] error:', error)
    
    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as { issues: Array<{ path: string[]; message: string }> }
      const errorMessages = zodError.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ')
      
      console.error('[API] Validation errors:', errorMessages)
      
      return NextResponse.json(
        {
          success: false,
          error: `驗證失敗: ${errorMessages}`,
          details: zodError.issues
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '更新工作單失敗'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/work-orders/[id]
 * 
 * Delete work order (CASCADE deletes capsulation order and ingredients).
 * 
 * Accessible by ADMIN only
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      )
    }

    // Authorization check - DELETE permission required (ADMIN only)
    if (!hasPermission(session.user.role, 'DELETE')) {
      return NextResponse.json(
        { success: false, error: '權限不足' },
        { status: 403 }
      )
    }

    const { id } = await context.params

    // Check if work order exists
    const existingWorkOrder = await prisma.unifiedWorkOrder.findUnique({
      where: { id },
      select: { 
        id: true, 
        jobNumber: true,
        status: true
      }
    })

    if (!existingWorkOrder) {
      return NextResponse.json(
        { success: false, error: '工作單不存在' },
        { status: 404 }
      )
    }

    // Delete work order (CASCADE handles related records)
    await prisma.unifiedWorkOrder.delete({
      where: { id }
    })

    // Get audit context
    const auditContext = await getUserContextFromRequest(request)

    // Log audit action
    await logAudit({
      action: AuditAction.WORK_ORDER_DELETED,
      userId: session.userId,
      phone: session.user.phoneE164,
      ip: auditContext.ip,
      userAgent: auditContext.userAgent,
      metadata: {
        workOrderId: existingWorkOrder.id,
        jobNumber: existingWorkOrder.jobNumber,
        status: existingWorkOrder.status
      }
    })

    return NextResponse.json(
      {
        success: true,
        message: '工作單已刪除'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] DELETE /api/work-orders/[id] error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '刪除工作單失敗'
      },
      { status: 500 }
    )
  }
}

