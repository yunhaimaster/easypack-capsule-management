import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { getUserContextFromRequest } from '@/lib/audit-context'
import { AuditAction } from '@prisma/client'
import { z } from 'zod'

const linkSchema = z.object({
  workOrderId: z.string().cuid()
})

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { workOrderId } = linkSchema.parse(body)

    // Get audit context
    const auditContext = await getUserContextFromRequest(request)

    // Check if work order exists and get current link status
    const workOrder = await prisma.unifiedWorkOrder.findUnique({
      where: { id: workOrderId },
      include: {
        productionOrder: {
          select: {
            id: true,
            productName: true
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

    // Get the encapsulation order
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      select: {
        id: true,
        productName: true,
        workOrderId: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: '膠囊訂單不存在' },
        { status: 404 }
      )
    }

    // Store previous link for audit
    const previousLink = order.workOrderId

    // Update link
    const updated = await prisma.productionOrder.update({
      where: { id },
      data: { workOrderId },
      include: {
        workOrder: {
          select: {
            id: true,
            jobNumber: true,
            customerName: true,
            workType: true
          }
        }
      }
    })

    // Audit logging
    await logAudit({
      action: AuditAction.LINK_CREATED,
      userId: auditContext.userId,
      phone: auditContext.phone,
      ip: auditContext.ip,
      userAgent: auditContext.userAgent,
      metadata: {
        sourceType: 'encapsulation-order',
        sourceId: id,
        sourceName: order.productName,
        targetType: 'work-order',
        targetId: workOrderId,
        targetName: workOrder.jobNumber || workOrder.customerName,
        previousLink: previousLink || null
      }
    })

    // Return with warning if work order was previously linked
    const response: Record<string, unknown> = {
      success: true,
      data: updated
    }

    if (workOrder.productionOrder && workOrder.productionOrder.id !== id) {
      response.warning = {
        existingLink: {
          id: workOrder.productionOrder.id,
          name: workOrder.productionOrder.productName
        }
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('[Link Order] Error:', error)
    return NextResponse.json(
      { success: false, error: '關聯失敗' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    // Get audit context
    const auditContext = await getUserContextFromRequest(request)

    // Get current link for audit
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      select: {
        id: true,
        productName: true,
        workOrderId: true,
        workOrder: {
          select: {
            id: true,
            jobNumber: true,
            customerName: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: '膠囊訂單不存在' },
        { status: 404 }
      )
    }

    if (!order.workOrderId) {
      return NextResponse.json(
        { success: false, error: '此訂單未關聯任何工作單' },
        { status: 400 }
      )
    }

    // Update to remove link
    const updated = await prisma.productionOrder.update({
      where: { id },
      data: { workOrderId: null }
    })

    // Audit logging
    await logAudit({
      action: AuditAction.LINK_REMOVED,
      userId: auditContext.userId,
      phone: auditContext.phone,
      ip: auditContext.ip,
      userAgent: auditContext.userAgent,
      metadata: {
        sourceType: 'encapsulation-order',
        sourceId: id,
        sourceName: order.productName,
        targetType: 'work-order',
        targetId: order.workOrderId,
        targetName: order.workOrder?.jobNumber || order.workOrder?.customerName || null
      }
    })

    return NextResponse.json({
      success: true,
      data: updated
    })

  } catch (error) {
    console.error('[Unlink Order] Error:', error)
    return NextResponse.json(
      { success: false, error: '取消關聯失敗' },
      { status: 500 }
    )
  }
}

