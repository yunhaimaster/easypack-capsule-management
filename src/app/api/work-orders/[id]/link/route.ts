import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { getUserContextFromRequest } from '@/lib/audit-context'
import { AuditAction } from '@prisma/client'
import { z } from 'zod'

const linkSchema = z.object({
  productionOrderId: z.string().cuid()
})

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { productionOrderId } = linkSchema.parse(body)

    // Get audit context
    const auditContext = await getUserContextFromRequest(request)

    // Check if encapsulation order exists and get current link status
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        workOrder: {
          select: {
            id: true,
            jobNumber: true,
            customerName: true
          }
        }
      }
    })

    if (!productionOrder) {
      return NextResponse.json(
        { success: false, error: '膠囊訂單不存在' },
        { status: 404 }
      )
    }

    // Get the work order
    const workOrder = await prisma.unifiedWorkOrder.findUnique({
      where: { id },
      select: {
        id: true,
        jobNumber: true,
        customerName: true,
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

    // Store previous link for audit (if work order had a different production order)
    const previousLink = workOrder.productionOrder?.id

    // Update the production order to link to this work order
    await prisma.productionOrder.update({
      where: { id: productionOrderId },
      data: { workOrderId: id }
    })

    // Fetch updated work order with new link
    const updated = await prisma.unifiedWorkOrder.findUnique({
      where: { id },
      include: {
        productionOrder: {
          select: {
            id: true,
            productName: true,
            customerName: true,
            productionQuantity: true
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
        sourceType: 'work-order',
        sourceId: id,
        sourceName: workOrder.jobNumber || workOrder.customerName,
        targetType: 'encapsulation-order',
        targetId: productionOrderId,
        targetName: productionOrder.productName,
        previousLink: previousLink || null
      }
    })

    // Return with warning if encapsulation order was previously linked
    const response: Record<string, unknown> = {
      success: true,
      data: updated
    }

    if (productionOrder.workOrder && productionOrder.workOrder.id !== id) {
      response.warning = {
        existingLink: {
          id: productionOrder.workOrder.id,
          name: productionOrder.workOrder.jobNumber || productionOrder.workOrder.customerName
        }
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('[Link Work Order] Error:', error)
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

    // Get work order with current link
    const workOrder = await prisma.unifiedWorkOrder.findUnique({
      where: { id },
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

    if (!workOrder.productionOrder) {
      return NextResponse.json(
        { success: false, error: '此工作單未關聯任何膠囊訂單' },
        { status: 400 }
      )
    }

    // Remove link by updating the production order
    await prisma.productionOrder.update({
      where: { id: workOrder.productionOrder.id },
      data: { workOrderId: null }
    })

    // Fetch updated work order
    const updated = await prisma.unifiedWorkOrder.findUnique({
      where: { id },
      include: {
        productionOrder: true
      }
    })

    // Audit logging
    await logAudit({
      action: AuditAction.LINK_REMOVED,
      userId: auditContext.userId,
      phone: auditContext.phone,
      ip: auditContext.ip,
      userAgent: auditContext.userAgent,
      metadata: {
        sourceType: 'work-order',
        sourceId: id,
        sourceName: workOrder.jobNumber || workOrder.customerName,
        targetType: 'encapsulation-order',
        targetId: workOrder.productionOrder.id,
        targetName: workOrder.productionOrder.productName
      }
    })

    return NextResponse.json({
      success: true,
      data: updated
    })

  } catch (error) {
    console.error('[Unlink Work Order] Error:', error)
    return NextResponse.json(
      { success: false, error: '取消關聯失敗' },
      { status: 500 }
    )
  }
}

