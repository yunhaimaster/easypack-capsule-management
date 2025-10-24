/**
 * Unified Work Orders API - Core CRUD Operations
 * 
 * GET /api/work-orders - List work orders with filters & pagination
 * POST /api/work-orders - Create new work order (with optional capsulation order)
 */

import { NextRequest, NextResponse } from 'next/server'
import { Prisma, AuditAction } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { createWorkOrderSchema, searchFiltersSchema } from '@/lib/validations/work-order-schemas'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/middleware/work-order-auth'
import { logAudit } from '@/lib/audit'
import { getUserContextFromRequest } from '@/lib/audit-context'

export const dynamic = 'force-dynamic'

/**
 * GET /api/work-orders
 * 
 * List work orders with advanced filtering, search, and pagination.
 * Accessible by all authenticated users (EMPLOYEE+).
 * 
 * Query Params:
 * - keyword: Search across multiple fields
 * - customerName: Filter by customer name
 * - personInCharge: Filter by person in charge IDs (array)
 * - workType: Filter by work types (array)
 * - status: Filter by statuses (array)
 * - dateFrom/dateTo: Date range filter
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 25, max: 100)
 * - sortBy: Sort field (default: createdAt)
 * - sortOrder: asc/desc (default: desc)
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

    // Authorization check - READ permission required
    if (!hasPermission(session.user.role, 'READ')) {
      return NextResponse.json(
        { success: false, error: '權限不足' },
        { status: 403 }
      )
    }

    // Parse and validate query parameters
    const { searchParams } = request.nextUrl
    
    const filters = {
      keyword: searchParams.get('keyword') || undefined,
      customerName: searchParams.get('customerName') || undefined,
      personInCharge: searchParams.getAll('personInCharge'),
      workType: searchParams.getAll('workType'),
      status: searchParams.getAll('status'),
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '25'),
      sortBy: (searchParams.get('sortBy') || 'createdAt') as any,
      sortOrder: (searchParams.get('sortOrder') || 'desc') as any
    }

    const validatedFilters = searchFiltersSchema.parse(filters)

    // Build Prisma where clause
    const where: Prisma.UnifiedWorkOrderWhereInput = {}
    const searchConditions: Prisma.UnifiedWorkOrderWhereInput[] = []

    // Keyword search across multiple fields
    if (validatedFilters.keyword) {
      searchConditions.push({
        OR: [
          { jobNumber: { contains: validatedFilters.keyword, mode: 'insensitive' } },
          { customerName: { contains: validatedFilters.keyword, mode: 'insensitive' } },
          { workDescription: { contains: validatedFilters.keyword, mode: 'insensitive' } }
        ]
      })
    }

    // Customer name filter
    if (validatedFilters.customerName) {
      searchConditions.push({
        customerName: {
          contains: validatedFilters.customerName,
          mode: 'insensitive'
        }
      })
    }

    // Person in charge filter
    if (validatedFilters.personInCharge && validatedFilters.personInCharge.length > 0) {
      where.personInChargeId = { in: validatedFilters.personInCharge }
    }

    // Work type filter
    if (validatedFilters.workType && validatedFilters.workType.length > 0) {
      where.workType = { in: validatedFilters.workType }
    }

    // Status filter
    if (validatedFilters.status && validatedFilters.status.length > 0) {
      where.status = { in: validatedFilters.status }
    }

    // Date range filter (expectedCompletionDate)
    if (validatedFilters.dateFrom || validatedFilters.dateTo) {
      where.expectedCompletionDate = {}
      if (validatedFilters.dateFrom) {
        where.expectedCompletionDate.gte = new Date(validatedFilters.dateFrom)
      }
      if (validatedFilters.dateTo) {
        where.expectedCompletionDate.lte = new Date(validatedFilters.dateTo)
      }
    }

    // Combine search conditions
    if (searchConditions.length > 0) {
      where.AND = searchConditions
    }

    // Calculate pagination
    const skip = (validatedFilters.page - 1) * validatedFilters.limit
    const take = validatedFilters.limit

    // Build order by
    const orderBy: Prisma.UnifiedWorkOrderOrderByWithRelationInput = {
      [validatedFilters.sortBy]: validatedFilters.sortOrder
    }

    // Execute query with count
    const [workOrders, total] = await Promise.all([
      prisma.unifiedWorkOrder.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          jobNumber: true,
          status: true,
          markedDate: true,
          customerName: true,
          personInChargeId: true,
          personInCharge: {
            select: {
              id: true,
              nickname: true,
              phoneE164: true
            }
          },
          workType: true,
          isNewProductVip: true,
          isComplexityVip: true,
          yearCategory: true,
          expectedCompletionDate: true,
          productionQuantity: true,
          packagingQuantity: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.unifiedWorkOrder.count({ where })
    ])

    // Return paginated results
    return NextResponse.json(
      {
        success: true,
        data: {
          workOrders,
          pagination: {
            page: validatedFilters.page,
            limit: validatedFilters.limit,
            total,
            totalPages: Math.ceil(total / validatedFilters.limit)
          }
        }
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=30'
        }
      }
    )
  } catch (error) {
    console.error('[API] GET /api/work-orders error:', error)
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
 * POST /api/work-orders
 * 
 * Create a new work order (with optional capsulation order).
 * Accessible by EMPLOYEE+ (all roles can create).
 * 
 * Validates:
 * - Request body against createWorkOrderSchema
 * - jobNumber uniqueness
 * - personInChargeId exists
 * - customerServiceId exists (if capsulation order provided)
 * 
 * Creates in transaction:
 * 1. UnifiedWorkOrder
 * 2. CapsulationOrder (if provided)
 * 3. CapsulationIngredients (if capsulation order provided)
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
    const validatedData = createWorkOrderSchema.parse(body)

    // Check jobNumber uniqueness
    const existing = await prisma.unifiedWorkOrder.findUnique({
      where: { jobNumber: validatedData.jobNumber },
      select: { id: true }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'JOB標號已存在' },
        { status: 400 }
      )
    }

    // Verify personInChargeId exists
    const personInCharge = await prisma.user.findUnique({
      where: { id: validatedData.personInChargeId },
      select: { id: true }
    })

    if (!personInCharge) {
      return NextResponse.json(
        { success: false, error: '負責人不存在' },
        { status: 400 }
      )
    }

    // If capsulation order with customer service, verify customerServiceId exists
    if (validatedData.capsulationOrder?.customerServiceId) {
      const customerService = await prisma.user.findUnique({
        where: { id: validatedData.capsulationOrder.customerServiceId },
        select: { id: true }
      })

      if (!customerService) {
        return NextResponse.json(
          { success: false, error: '客服不存在' },
          { status: 400 }
        )
      }
    }

    // Create work order in transaction
    const workOrder = await prisma.$transaction(async (tx) => {
      // Create unified work order
      const newWorkOrder = await tx.unifiedWorkOrder.create({
        data: {
          jobNumber: validatedData.jobNumber,
          markedDate: validatedData.markedDate ? new Date(validatedData.markedDate) : null,
          customerName: validatedData.customerName,
          personInChargeId: validatedData.personInChargeId,
          workType: validatedData.workType,
          isNewProductVip: validatedData.isNewProductVip,
          isComplexityVip: validatedData.isComplexityVip,
          yearCategory: validatedData.yearCategory,
          expectedCompletionDate: validatedData.expectedCompletionDate ? new Date(validatedData.expectedCompletionDate) : null,
          dataCompleteDate: validatedData.dataCompleteDate ? new Date(validatedData.dataCompleteDate) : null,
          productionQuantity: validatedData.productionQuantity,
          packagingQuantity: validatedData.packagingQuantity,
          internalDeliveryTime: validatedData.internalDeliveryTime,
          customerRequestedTime: validatedData.customerRequestedTime,
          workDescription: validatedData.workDescription,
          notes: validatedData.notes,
          createdBy: session.userId
        },
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

      // Create capsulation order if provided
      if (validatedData.capsulationOrder) {
        const capsulationData = validatedData.capsulationOrder

        // Calculate unitWeightMg and batchTotalWeightMg
        const unitWeightMg = capsulationData.ingredients.reduce((sum, ing) => sum + ing.unitContentMg, 0)
        const batchTotalWeightMg = unitWeightMg * capsulationData.productionQuantity

        await tx.capsulationOrder.create({
          data: {
            workOrderId: newWorkOrder.id,
            productName: capsulationData.productName,
            productionQuantity: capsulationData.productionQuantity,
            unitWeightMg,
            batchTotalWeightMg,
            completionDate: capsulationData.completionDate ? new Date(capsulationData.completionDate) : null,
            capsuleColor: capsulationData.capsuleColor,
            capsuleSize: capsulationData.capsuleSize,
            capsuleType: capsulationData.capsuleType,
            customerServiceId: capsulationData.customerServiceId,
            ingredients: {
              createMany: {
                data: capsulationData.ingredients.map(ing => ({
                  materialName: ing.materialName,
                  unitContentMg: ing.unitContentMg,
                  isCustomerProvided: ing.isCustomerProvided,
                  isCustomerSupplied: ing.isCustomerSupplied
                }))
              }
            }
          }
        })
      }

      return newWorkOrder
    })

    // Get audit context
    const auditContext = await getUserContextFromRequest(request)

    // Log audit action
    await logAudit({
      action: AuditAction.WORK_ORDER_CREATED,
      userId: session.userId,
      phone: session.user.phoneE164,
      ip: auditContext.ip,
      userAgent: auditContext.userAgent,
      metadata: {
        workOrderId: workOrder.id,
        jobNumber: workOrder.jobNumber,
        workType: workOrder.workType,
        hasCapsulationOrder: !!validatedData.capsulationOrder
      }
    })

    // Return created work order
    return NextResponse.json(
      {
        success: true,
        data: workOrder
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API] POST /api/work-orders error:', error)
    
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
        error: error instanceof Error ? error.message : '建立工作單失敗'
      },
      { status: 500 }
    )
  }
}

