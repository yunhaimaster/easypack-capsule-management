/**
 * Unified Work Orders API - Core CRUD Operations
 * 
 * GET /api/work-orders - List work orders with filters & pagination
 * POST /api/work-orders - Create new work order (with optional capsulation order)
 */

import { NextRequest, NextResponse } from 'next/server'
import { Prisma, AuditAction } from '@prisma/client'
import { prisma, executeWithRetry, isConnectionError } from '@/lib/prisma'
import { createWorkOrderSchema, searchFiltersSchema } from '@/lib/validations/work-order-schemas'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/middleware/work-order-auth'
import { logAudit } from '@/lib/audit'
import { getUserContextFromRequest } from '@/lib/audit-context'
import { syncToSchedulingEntry } from '@/lib/sync/scheduling-capsulation-sync'

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
      status: searchParams.getAll('status').map(s => s === 'null' ? null : s), // Convert string "null" to actual null
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '25'),
      sortBy: (searchParams.get('sortBy') || 'createdAt') as any,
      sortOrder: (searchParams.get('sortOrder') || 'desc') as any,
      // Smart filter fields
      productionMaterialsReady: searchParams.get('productionMaterialsReady') === 'true' ? true : searchParams.get('productionMaterialsReady') === 'false' ? false : undefined,
      packagingMaterialsReady: searchParams.get('packagingMaterialsReady') === 'true' ? true : searchParams.get('packagingMaterialsReady') === 'false' ? false : undefined,
      productionStarted: searchParams.get('productionStarted') === 'true' ? true : searchParams.get('productionStarted') === 'false' ? false : undefined,
      isUrgent: searchParams.get('isUrgent') === 'true' ? true : searchParams.get('isUrgent') === 'false' ? false : undefined,
      isVip: searchParams.get('isVip') === 'true' ? true : searchParams.get('isVip') === 'false' ? false : undefined,
      isCompleted: searchParams.get('isCompleted') === 'true' ? true : searchParams.get('isCompleted') === 'false' ? false : undefined
    }

    const validatedFilters = searchFiltersSchema.parse(filters)

    // Build Prisma where clause
    const where: Prisma.UnifiedWorkOrderWhereInput = {}
    const searchConditions: Prisma.UnifiedWorkOrderWhereInput[] = []

    // Enhanced keyword search across multiple fields with partial matching
    if (validatedFilters.keyword) {
      const keyword = validatedFilters.keyword.trim()
      
      // Build comprehensive search conditions
      const keywordConditions: Prisma.UnifiedWorkOrderWhereInput[] = []
      
      // Direct fields (case-insensitive partial match)
      keywordConditions.push(
        { jobNumber: { contains: keyword, mode: 'insensitive' } },
        { customerName: { contains: keyword, mode: 'insensitive' } },
        { workDescription: { contains: keyword, mode: 'insensitive' } },
        { notes: { contains: keyword, mode: 'insensitive' } }
      )
      
      // Search in related person in charge (nickname or phone)
      keywordConditions.push({
        personInCharge: {
          OR: [
            { nickname: { contains: keyword, mode: 'insensitive' } },
            { phoneE164: { contains: keyword, mode: 'insensitive' } }
          ]
        }
      })
      
      // Search in related production orders (product name and customer name)
      keywordConditions.push({
        productionOrders: {
          some: {
            OR: [
              { productName: { contains: keyword, mode: 'insensitive' } },
              { customerName: { contains: keyword, mode: 'insensitive' } }
            ]
          }
        }
      })
      
      // Search in related capsulation order (product name)
      keywordConditions.push({
        capsulationOrder: {
          productName: { contains: keyword, mode: 'insensitive' }
        }
      })
      
      // Combine all keyword conditions with OR
      searchConditions.push({
        OR: keywordConditions
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

    // Status filter - handle null values for ongoing work
    if (validatedFilters.status && validatedFilters.status.length > 0) {
      const statuses = validatedFilters.status.filter(s => s !== null) as any[]
      const hasNull = validatedFilters.status.includes(null)
      
      if (statuses.length > 0 && hasNull) {
        // Include both specific statuses and null
        where.status = { in: [...statuses, null] }
      } else if (statuses.length > 0) {
        // Only specific statuses
        where.status = { in: statuses }
      } else if (hasNull) {
        // Only null (ongoing work)
        where.status = null
      }
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

    // Smart filter fields
    if (validatedFilters.productionMaterialsReady !== undefined) {
      where.productionMaterialsReady = validatedFilters.productionMaterialsReady
    }

    if (validatedFilters.packagingMaterialsReady !== undefined) {
      where.packagingMaterialsReady = validatedFilters.packagingMaterialsReady
    }

    if (validatedFilters.productionStarted !== undefined) {
      where.productionStarted = validatedFilters.productionStarted
    }

    if (validatedFilters.isUrgent !== undefined) {
      where.isUrgent = validatedFilters.isUrgent
    }

    if (validatedFilters.isVip !== undefined) {
      where.OR = [
        { isCustomerServiceVip: validatedFilters.isVip },
        { isBossVip: validatedFilters.isVip }
      ]
    }

    if (validatedFilters.isCompleted !== undefined) {
      where.isCompleted = validatedFilters.isCompleted
    }

    // Combine search conditions
    if (searchConditions.length > 0) {
      where.AND = searchConditions
    }

    // Calculate pagination
    const skip = (validatedFilters.page - 1) * validatedFilters.limit
    const take = validatedFilters.limit

    // Build order by
    // Handle personInCharge sorting specially (it's a relation)
    const orderBy: Prisma.UnifiedWorkOrderOrderByWithRelationInput = 
      validatedFilters.sortBy === 'personInCharge'
        ? {
            personInCharge: {
              nickname: validatedFilters.sortOrder
            }
          }
        : {
            [validatedFilters.sortBy]: validatedFilters.sortOrder
          }

    // Execute query with count - using retry wrapper for connection errors
    const [workOrders, total] = await Promise.all([
      executeWithRetry(() => prisma.unifiedWorkOrder.findMany({
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
          
          // New VIP flags
          isCustomerServiceVip: true,
          isBossVip: true,
          
          // New material ready status
          expectedProductionMaterialsDate: true,
          expectedPackagingMaterialsDate: true,
          productionMaterialsReady: true,
          packagingMaterialsReady: true,
          
          // Quantities
          productionQuantity: true,
          productionQuantityStat: true,  // Unit for production (粒/瓶/盒/個)
          packagingQuantity: true,
          packagingQuantityStat: true,   // Unit for packaging (粒/瓶/盒/個)
          
          // New delivery dates
          requestedDeliveryDate: true,
          internalExpectedDate: true,
          
          // New status flags
          isUrgent: true,
          productionStarted: true,
          isCompleted: true,
          
          // Description
          workDescription: true,
          
          // NEW: Include linked production orders (1:many)
          productionOrders: {
            select: {
              id: true,
              productName: true,
              customerName: true,
              productionQuantity: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5  // Limit for list view
          },
          
          // Timestamps
          createdAt: true,
          updatedAt: true
        }
      })),
      executeWithRetry(() => prisma.unifiedWorkOrder.count({ where }))
    ])

    // Map to include first order for backward compatibility
    const serializedWorkOrders = workOrders.map(wo => ({
      ...wo,
      productionOrder: wo.productionOrders?.[0] || null  // First order for compatibility
    }))

    // Return paginated results
    return NextResponse.json(
      {
        success: true,
        data: {
          workOrders: serializedWorkOrders,
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
    // Log error details (without sensitive data)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isConnError = isConnectionError(error)
    
    console.error('[API] GET /api/work-orders error:', {
      message: errorMessage,
      isConnectionError: isConnError,
      errorCode: error && typeof error === 'object' && 'code' in error ? (error as any).code : undefined
    })
    
    // Return user-friendly error message
    if (isConnError) {
      return NextResponse.json(
        {
          success: false,
          error: '數據庫連接失敗，請稍後重試'
        },
        { status: 503 } // Service Unavailable
      )
    }
    
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

    // Check jobNumber uniqueness (only if provided)
    if (validatedData.jobNumber) {
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
          jobNumber: validatedData.jobNumber || null,
          customerName: validatedData.customerName,
          personInChargeId: validatedData.personInChargeId,
          workType: validatedData.workType,
          workDescription: validatedData.workDescription,
          
          // VIP標記
          isCustomerServiceVip: validatedData.isCustomerServiceVip ?? false,
          isBossVip: validatedData.isBossVip ?? false,
          
          // 物料到齊狀態
          expectedProductionMaterialsDate: validatedData.expectedProductionMaterialsDate ? new Date(validatedData.expectedProductionMaterialsDate) : null,
          expectedPackagingMaterialsDate: validatedData.expectedPackagingMaterialsDate ? new Date(validatedData.expectedPackagingMaterialsDate) : null,
          productionMaterialsReady: validatedData.productionMaterialsReady ?? false,
          packagingMaterialsReady: validatedData.packagingMaterialsReady ?? false,
          
          // 數量
          productionQuantity: validatedData.productionQuantity ?? null,
          packagingQuantity: validatedData.packagingQuantity ?? null,
          
          // 交貨期
          requestedDeliveryDate: validatedData.requestedDeliveryDate ? new Date(validatedData.requestedDeliveryDate) : null,
          internalExpectedDate: validatedData.internalExpectedDate ? new Date(validatedData.internalExpectedDate) : null,
          
          // 狀態標記
          isUrgent: validatedData.isUrgent ?? false,
          productionStarted: validatedData.productionStarted ?? false,
          isCompleted: validatedData.isCompleted ?? false,
          
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
            processIssues: capsulationData.processIssues || null,
            qualityNotes: capsulationData.qualityNotes || null,
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

        // Sync processIssues and qualityNotes to scheduling entry if exists
        if (capsulationData.processIssues || capsulationData.qualityNotes) {
          const syncResult = await syncToSchedulingEntry(
            newWorkOrder.id,
            capsulationData.processIssues || null,
            capsulationData.qualityNotes || null
          )
          
          if (!syncResult.success) {
            // Log sync failure but don't fail the operation
            await logAudit({
              action: AuditAction.SCHEDULING_SYNC_FAILED,
              userId: session.userId,
              phone: session.user.phoneE164,
              ip: (await getUserContextFromRequest(request)).ip,
              userAgent: (await getUserContextFromRequest(request)).userAgent,
              metadata: {
                workOrderId: newWorkOrder.id,
                error: syncResult.error,
                syncDirection: 'capsulation-create-to-scheduling'
              }
            })
          }
        }
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

