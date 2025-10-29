/**
 * Manager Scheduling Table API - Update & Delete Operations
 * 
 * PATCH /api/manager-scheduling/[id] - Update scheduling entry (any field except createdAt)
 * DELETE /api/manager-scheduling/[id] - Remove from scheduling table
 */

import { NextRequest, NextResponse } from 'next/server'
import { AuditAction, WorkType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { updateSchedulingEntrySchema } from '@/lib/validations/manager-scheduling-schemas'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/middleware/manager-scheduling-auth'
import { logAudit } from '@/lib/audit'
import { getUserContextFromRequest } from '@/lib/audit-context'
import { syncToCapsulationOrder, syncToWorkOrder } from '@/lib/sync/scheduling-capsulation-sync'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/manager-scheduling/[id]
 * 
 * Update a scheduling entry. All fields are editable except createdAt (system-generated).
 * Updates trigger bidirectional sync to CapsulationOrder and UnifiedWorkOrder.
 * 
 * Accessible by MANAGER and ADMIN only (UPDATE permission).
 * 
 * Body:
 * - priority?: number
 * - processIssues?: string | null
 * - qualityNotes?: string | null
 * - expectedProductionStartDate?: string | null
 * - customerName?: string
 * - personInChargeId?: string | null
 * - workType?: WorkType
 * - expectedProductionMaterialsDate?: Date | null
 * - productionMaterialsReady?: boolean
 * - workDescription?: string
 * - productionQuantity?: number | null
 * 
 * Returns:
 * - success: boolean
 * - data: Updated ManagerSchedulingEntry
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
    const validatedData = updateSchedulingEntrySchema.parse(body)

    // Get existing entry with work order
    const existingEntry = await prisma.managerSchedulingEntry.findUnique({
      where: { id },
      include: {
        workOrder: {
          select: {
            id: true,
            workType: true
          }
        }
      }
    })

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, error: '排單表項目不存在' },
        { status: 404 }
      )
    }

    // Validate work type if updating (must remain PRODUCTION or PRODUCTION_PACKAGING)
    if (validatedData.workType !== undefined) {
      if (validatedData.workType !== WorkType.PRODUCTION && validatedData.workType !== WorkType.PRODUCTION_PACKAGING) {
        return NextResponse.json(
          { success: false, error: '工作類型必須是生產或生產+包裝' },
          { status: 400 }
        )
      }
    }

    // Prepare update data for scheduling entry
    const schedulingUpdateData: {
      priority?: number
      processIssues?: string | null
      qualityNotes?: string | null
      expectedProductionStartDate?: string | null
    } = {}

    if (validatedData.priority !== undefined) schedulingUpdateData.priority = validatedData.priority
    if (validatedData.processIssues !== undefined) schedulingUpdateData.processIssues = validatedData.processIssues
    if (validatedData.qualityNotes !== undefined) schedulingUpdateData.qualityNotes = validatedData.qualityNotes
    if (validatedData.expectedProductionStartDate !== undefined) {
      schedulingUpdateData.expectedProductionStartDate = validatedData.expectedProductionStartDate
    }

    // Prepare update data for work order
    const workOrderUpdateData: {
      customerName?: string
      personInChargeId?: string | null
      workType?: WorkType
      expectedProductionMaterialsDate?: Date | null
      productionMaterialsReady?: boolean
      workDescription?: string
      productionQuantity?: number | null
    } = {}

    if (validatedData.customerName !== undefined) workOrderUpdateData.customerName = validatedData.customerName
    if (validatedData.personInChargeId !== undefined) workOrderUpdateData.personInChargeId = validatedData.personInChargeId
    if (validatedData.workType !== undefined) workOrderUpdateData.workType = validatedData.workType
    if (validatedData.expectedProductionMaterialsDate !== undefined) {
      workOrderUpdateData.expectedProductionMaterialsDate = validatedData.expectedProductionMaterialsDate
        ? new Date(validatedData.expectedProductionMaterialsDate)
        : null
    }
    if (validatedData.productionMaterialsReady !== undefined) {
      workOrderUpdateData.productionMaterialsReady = validatedData.productionMaterialsReady
    }
    if (validatedData.workDescription !== undefined) workOrderUpdateData.workDescription = validatedData.workDescription
    if (validatedData.productionQuantity !== undefined) {
      workOrderUpdateData.productionQuantity = validatedData.productionQuantity
    }

    // Use transaction to ensure atomicity
    const updatedEntry = await prisma.$transaction(async (tx) => {
      // Update scheduling entry
      const updated = await tx.managerSchedulingEntry.update({
        where: { id },
        data: schedulingUpdateData,
        include: {
          workOrder: {
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
                  id: true,
                  processIssues: true,
                  qualityNotes: true
                }
              },
              productionOrders: {
                select: {
                  id: true,
                  processIssues: true,
                  qualityNotes: true
                },
                take: 1,
                orderBy: { createdAt: 'asc' }
              }
            }
          }
        }
      })

      // Update work order if needed
      if (Object.keys(workOrderUpdateData).length > 0) {
        const syncResult = await syncToWorkOrder(existingEntry.workOrderId, workOrderUpdateData)
        if (!syncResult.success) {
          // Log sync failure but don't fail the operation
          await logAudit({
            action: AuditAction.SCHEDULING_SYNC_FAILED,
            userId: session.userId,
            phone: session.user.phoneE164,
            ip: (await getUserContextFromRequest(request)).ip,
            userAgent: (await getUserContextFromRequest(request)).userAgent,
            metadata: {
              schedulingEntryId: id,
              workOrderId: existingEntry.workOrderId,
              error: syncResult.error,
              failedFields: Object.keys(workOrderUpdateData)
            }
          })
        }
      }

      return updated
    })

    // Transform entry to include productionOrder fallback
    const firstProductionOrder = updatedEntry.workOrder.productionOrders?.[0] || null
    const sourceOrder = updatedEntry.workOrder.capsulationOrder || firstProductionOrder
    const transformedEntry = {
      ...updatedEntry,
      workOrder: {
        ...updatedEntry.workOrder,
        personInCharge: updatedEntry.workOrder.personInCharge || null,
        capsulationOrder: updatedEntry.workOrder.capsulationOrder || null,
        productionOrder: firstProductionOrder
      },
      // Use source order data if scheduling entry has null values
      processIssues: updatedEntry.processIssues ?? sourceOrder?.processIssues ?? null,
      qualityNotes: updatedEntry.qualityNotes ?? sourceOrder?.qualityNotes ?? null
    }

    // Sync to capsulation order if processIssues or qualityNotes updated
    if (validatedData.processIssues !== undefined || validatedData.qualityNotes !== undefined) {
      const syncResult = await syncToCapsulationOrder(
        existingEntry.workOrderId,
        validatedData.processIssues,
        validatedData.qualityNotes
      )

      if (!syncResult.success) {
        // Log sync failure but don't fail the operation
        const auditContext = await getUserContextFromRequest(request)
        await logAudit({
          action: AuditAction.SCHEDULING_SYNC_FAILED,
          userId: session.userId,
          phone: session.user.phoneE164,
          ip: auditContext.ip,
          userAgent: auditContext.userAgent,
          metadata: {
            schedulingEntryId: id,
            workOrderId: existingEntry.workOrderId,
            error: syncResult.error,
            syncDirection: 'scheduling-to-capsulation'
          }
        })
      }
    }

    // Get audit context
    const auditContext = await getUserContextFromRequest(request)

    // Log audit action
    await logAudit({
      action: AuditAction.SCHEDULING_ENTRY_UPDATED,
      userId: session.userId,
      phone: session.user.phoneE164,
      ip: auditContext.ip,
      userAgent: auditContext.userAgent,
      metadata: {
        schedulingEntryId: id,
        workOrderId: existingEntry.workOrderId,
        updatedFields: Object.keys(validatedData)
      }
    })

    // Return updated entry
    return NextResponse.json(
      {
        success: true,
        data: transformedEntry
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] PATCH /api/manager-scheduling/[id] error:', error)
    
    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as { issues: Array<{ path: string[]; message: string }> }
      const errorMessages = zodError.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ')
      
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
        error: error instanceof Error ? error.message : '更新排單表項目失敗'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/manager-scheduling/[id]
 * 
 * Remove a work order from the scheduling table.
 * Accessible by MANAGER and ADMIN only (DELETE permission).
 * 
 * Returns:
 * - success: boolean
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

    // Authorization check - DELETE permission required
    if (!hasPermission(session.user.role, 'DELETE')) {
      return NextResponse.json(
        { success: false, error: '權限不足' },
        { status: 403 }
      )
    }

    const { id } = await context.params

    // Get entry before deletion for audit
    const entry = await prisma.managerSchedulingEntry.findUnique({
      where: { id },
      select: {
        id: true,
        workOrderId: true,
        priority: true
      }
    })

    if (!entry) {
      return NextResponse.json(
        { success: false, error: '排單表項目不存在' },
        { status: 404 }
      )
    }

    // Delete entry
    await prisma.managerSchedulingEntry.delete({
      where: { id }
    })

    // Get audit context
    const auditContext = await getUserContextFromRequest(request)

    // Log audit action
    await logAudit({
      action: AuditAction.SCHEDULING_ENTRY_DELETED,
      userId: session.userId,
      phone: session.user.phoneE164,
      ip: auditContext.ip,
      userAgent: auditContext.userAgent,
      metadata: {
        schedulingEntryId: id,
        workOrderId: entry.workOrderId,
        priority: entry.priority
      }
    })

    // Return success
    return NextResponse.json(
      {
        success: true,
        message: '已從排單表移除'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] DELETE /api/manager-scheduling/[id] error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '從排單表移除失敗'
      },
      { status: 500 }
    )
  }
}

