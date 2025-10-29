/**
 * Manager Scheduling Table API - List & Create Operations
 * 
 * GET /api/manager-scheduling - List all scheduling entries ordered by priority
 * POST /api/manager-scheduling - Add work order to scheduling table
 */

import { NextRequest, NextResponse } from 'next/server'
import { Prisma, AuditAction, WorkType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { createSchedulingEntrySchema } from '@/lib/validations/manager-scheduling-schemas'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/middleware/manager-scheduling-auth'
import { logAudit } from '@/lib/audit'
import { getUserContextFromRequest } from '@/lib/audit-context'
import { syncToCapsulationOrder, syncToSchedulingEntry } from '@/lib/sync/scheduling-capsulation-sync'

export const dynamic = 'force-dynamic'

/**
 * GET /api/manager-scheduling
 * 
 * List all scheduling entries ordered by priority ASC.
 * Accessible by all authenticated users (VIEW permission).
 * 
 * Returns:
 * - success: boolean
 * - data: { entries: ManagerSchedulingEntry[] }
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      )
    }

    // Authorization check - VIEW permission required
    if (!hasPermission(session.user.role, 'VIEW')) {
      return NextResponse.json(
        { success: false, error: '權限不足' },
        { status: 403 }
      )
    }

    // Fetch all scheduling entries with work order and capsulation order data
    const entries = await prisma.managerSchedulingEntry.findMany({
      orderBy: { priority: 'asc' },
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

    // Transform entries to ensure capsulationOrder/productionOrder is always present (even if null)
    const transformedEntries = entries.map(entry => {
      // Use first ProductionOrder if CapsulationOrder doesn't exist
      const firstProductionOrder = entry.workOrder.productionOrders?.[0] || null
      const sourceOrder = entry.workOrder.capsulationOrder || firstProductionOrder
      
      return {
        ...entry,
        workOrder: {
          ...entry.workOrder,
          personInCharge: entry.workOrder.personInCharge || null,
          capsulationOrder: entry.workOrder.capsulationOrder || null,
          // Add productionOrder for fallback access
          productionOrder: firstProductionOrder
        },
        // Use source order data if scheduling entry has null values
        processIssues: entry.processIssues ?? sourceOrder?.processIssues ?? null,
        qualityNotes: entry.qualityNotes ?? sourceOrder?.qualityNotes ?? null
      }
    })

    // Sync processIssues and qualityNotes from capsulationOrder/productionOrder to scheduling entry if missing
    const syncedEntries = await Promise.all(
      transformedEntries.map(async (entry) => {
        // Determine source order (capsulationOrder or first productionOrder)
        const sourceOrder = entry.workOrder.capsulationOrder || entry.workOrder.productionOrder
        const sourceProcessIssues = sourceOrder?.processIssues
        const sourceQualityNotes = sourceOrder?.qualityNotes
        
        // If scheduling entry has null values but source order has values, sync them
        if ((entry.processIssues === null && sourceProcessIssues) ||
            (entry.qualityNotes === null && sourceQualityNotes)) {
          // Update scheduling entry with source order values
          const updatedEntry = await prisma.managerSchedulingEntry.update({
            where: { id: entry.id },
            data: {
              processIssues: entry.processIssues ?? sourceProcessIssues ?? null,
              qualityNotes: entry.qualityNotes ?? sourceQualityNotes ?? null
            },
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
          
          const updatedFirstProductionOrder = updatedEntry.workOrder.productionOrders?.[0] || null
          const updatedSourceOrder = updatedEntry.workOrder.capsulationOrder || updatedFirstProductionOrder
          
          return {
            ...updatedEntry,
            workOrder: {
              ...updatedEntry.workOrder,
              personInCharge: updatedEntry.workOrder.personInCharge || null,
              capsulationOrder: updatedEntry.workOrder.capsulationOrder || null,
              productionOrder: updatedFirstProductionOrder
            },
            // Use source order data
            processIssues: updatedEntry.processIssues ?? updatedSourceOrder?.processIssues ?? null,
            qualityNotes: updatedEntry.qualityNotes ?? updatedSourceOrder?.qualityNotes ?? null
          }
        }
        return entry
      })
    )

    // Return entries
    return NextResponse.json(
      {
        success: true,
        data: { entries: syncedEntries }
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=30'
        }
      }
    )
  } catch (error) {
    console.error('[API] GET /api/manager-scheduling error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '查詢排單表失敗'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/manager-scheduling
 * 
 * Add a work order to the scheduling table.
 * Accessible by MANAGER and ADMIN only (CREATE permission).
 * 
 * Validates:
 * - Work order exists
 * - Work type is PRODUCTION or PRODUCTION_PACKAGING (only capsule production)
 * - Work order not already in scheduling table (unique constraint)
 * 
 * Body:
 * - workOrderId: string (cuid)
 * 
 * Returns:
 * - success: boolean
 * - data: ManagerSchedulingEntry (with work order data)
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

    // Authorization check - CREATE permission required
    if (!hasPermission(session.user.role, 'CREATE')) {
      return NextResponse.json(
        { success: false, error: '權限不足' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createSchedulingEntrySchema.parse(body)

    // Check work order exists and get work type
    const workOrder = await prisma.unifiedWorkOrder.findUnique({
      where: { id: validatedData.workOrderId },
      select: {
        id: true,
        workType: true,
        capsulationOrder: {
          select: {
            processIssues: true,
            qualityNotes: true
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

    // Validate work type - only PRODUCTION or PRODUCTION_PACKAGING allowed
    if (workOrder.workType !== WorkType.PRODUCTION && workOrder.workType !== WorkType.PRODUCTION_PACKAGING) {
      return NextResponse.json(
        { success: false, error: '只有生產或生產+包裝類型的工作單可以加入排單表' },
        { status: 400 }
      )
    }

    // Check if already in scheduling table
    const existingEntry = await prisma.managerSchedulingEntry.findUnique({
      where: { workOrderId: validatedData.workOrderId },
      select: { id: true }
    })

    if (existingEntry) {
      return NextResponse.json(
        { success: false, error: '此工作單已存在於排單表中' },
        { status: 400 }
      )
    }

    // Calculate priority (max priority + 1, or 1 if table empty)
    const maxPriorityResult = await prisma.managerSchedulingEntry.findFirst({
      orderBy: { priority: 'desc' },
      select: { priority: true }
    })

    const priority = maxPriorityResult ? maxPriorityResult.priority + 1 : 1

    // Create scheduling entry
    const schedulingEntry = await prisma.managerSchedulingEntry.create({
      data: {
        workOrderId: validatedData.workOrderId,
        priority,
        // Sync capsulation order fields if exists
        processIssues: workOrder.capsulationOrder?.processIssues || null,
        qualityNotes: workOrder.capsulationOrder?.qualityNotes || null,
        expectedProductionStartDate: null,
        createdBy: session.userId
      },
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
            }
          }
        }
      }
    })

    // Get audit context
    const auditContext = await getUserContextFromRequest(request)

    // Log audit action
    await logAudit({
      action: AuditAction.SCHEDULING_ENTRY_CREATED,
      userId: session.userId,
      phone: session.user.phoneE164,
      ip: auditContext.ip,
      userAgent: auditContext.userAgent,
      metadata: {
        schedulingEntryId: schedulingEntry.id,
        workOrderId: validatedData.workOrderId,
        priority
      }
    })

    // Return created entry
    return NextResponse.json(
      {
        success: true,
        data: schedulingEntry
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API] POST /api/manager-scheduling error:', error)
    
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

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '新增到排單表失敗'
      },
      { status: 500 }
    )
  }
}

