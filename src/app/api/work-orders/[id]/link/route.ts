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
        productionOrders: {
          select: {
            id: true,
            productName: true
          },
          take: 1  // Just need first one for checking previous link
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
    const previousLink = workOrder.productionOrders?.[0]?.id

    // Update the production order to link to this work order
    await prisma.productionOrder.update({
      where: { id: productionOrderId },
      data: { workOrderId: id }
    })

    // Fetch updated work order with new link
    const updated = await prisma.unifiedWorkOrder.findUnique({
      where: { id },
      include: {
        productionOrders: {
          select: {
            id: true,
            productName: true,
            customerName: true,
            productionQuantity: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5  // Limit for response
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

    // Get work order with current links
    const workOrder = await prisma.unifiedWorkOrder.findUnique({
      where: { id },
      include: {
        productionOrders: {
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

    if (!workOrder.productionOrders || workOrder.productionOrders.length === 0) {
      return NextResponse.json(
        { success: false, error: '此工作單未關聯任何膠囊訂單' },
        { status: 400 }
      )
    }

    // Note: With 1:many relationship, we need productionOrderId to specify which link to remove
    // For now, we'll remove all links (or could remove just the first one)
    // Better approach: remove this DELETE handler and use DELETE from orders/[id]/link instead
    const productionOrderIds = workOrder.productionOrders.map(po => po.id)
    
    // Remove all links
    await prisma.productionOrder.updateMany({
      where: { id: { in: productionOrderIds } },
      data: { workOrderId: null }
    })

    // Fetch updated work order
    const updated = await prisma.unifiedWorkOrder.findUnique({
      where: { id },
      include: {
        productionOrders: true
      }
    })

    // Audit logging for all removed links
    for (const po of workOrder.productionOrders) {
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
          targetId: po.id,
          targetName: po.productName
        }
      })
    }

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

