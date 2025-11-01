import { NextRequest, NextResponse } from 'next/server'
import { Prisma, AuditAction, ProductionOrderStatus } from '@prisma/client'
import { prisma, executeWithRetry, isConnectionError } from '@/lib/prisma'
import { productionOrderSchema, searchFiltersSchema, worklogSchema } from '@/lib/validations'
import { SearchFilters } from '@/types'
import { calculateWorkUnits } from '@/lib/worklog'
import { DateTime } from 'luxon'
import { logger } from '@/lib/logger'
import { jsonSuccess, jsonError } from '@/lib/api-response'
import { getSessionFromCookie } from '@/lib/auth/session'
import { logAudit } from '@/lib/audit'
import { getUserContextFromRequest } from '@/lib/audit-context'
import { calculateOrderStatus } from '@/lib/order-status'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 minutes

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getSessionFromCookie()
    if (!session) {
      return jsonError(401, {
        code: 'UNAUTHORIZED',
        message: '未授權'
      })
    }

    const { searchParams } = request.nextUrl
    
    // Support array-based status filter
    const statusParams = searchParams.getAll('status')
    const validStatuses = statusParams.filter(s => 
      s === 'NOT_STARTED' || s === 'IN_PROGRESS' || s === 'COMPLETED'
    ) as ('NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED')[]
    
    // Support array-based customerServiceId filter
    const customerServiceIds = searchParams.getAll('customerServiceId')
    
    // Support keyword search (cross-field)
    const keyword = searchParams.get('keyword') || undefined
    
    // Single status param for backward compatibility
    const statusParam = searchParams.get('status')
    const validStatus = statusParam && (statusParam === 'NOT_STARTED' || statusParam === 'IN_PROGRESS' || statusParam === 'COMPLETED')
      ? statusParam as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
      : undefined
    
    const filters: SearchFilters = {
      customerName: searchParams.get('customerName') || undefined,
      productName: searchParams.get('productName') || undefined,
      ingredientName: searchParams.get('ingredientName') || undefined,
      capsuleType: searchParams.get('capsuleType') || undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      minQuantity: searchParams.get('minQuantity') ? parseInt(searchParams.get('minQuantity')!) : undefined,
      maxQuantity: searchParams.get('maxQuantity') ? parseInt(searchParams.get('maxQuantity')!) : undefined,
      isCompleted: searchParams.get('isCompleted') ? searchParams.get('isCompleted') === 'true' : undefined,
      ...(validStatus && { status: validStatus }), // Only include if valid (backward compatibility)
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '25'),
      sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc'
    }

    const validatedFilters = searchFiltersSchema.parse(filters)
    
    const where: Prisma.ProductionOrderWhereInput = {}

    const searchConditions: Prisma.ProductionOrderWhereInput[] = []

    // Enhanced keyword search (searches across multiple fields)
    if (keyword) {
      const keywordTrimmed = keyword.trim()
      const keywordConditions: Prisma.ProductionOrderWhereInput[] = [
        { customerName: { contains: keywordTrimmed, mode: 'insensitive' } },
        { productName: { contains: keywordTrimmed, mode: 'insensitive' } },
        {
          ingredients: {
            some: {
              materialName: { contains: keywordTrimmed, mode: 'insensitive' }
            }
          }
        }
      ]
      searchConditions.push({ OR: keywordConditions })
    }

    // Individual field filters (only if keyword not provided, or as additional filters)
    if (validatedFilters.customerName) {
      searchConditions.push({
        customerName: {
          contains: validatedFilters.customerName,
          mode: 'insensitive'
        }
      })
    }

    if (validatedFilters.productName) {
      searchConditions.push({
        productName: {
          contains: validatedFilters.productName,
          mode: 'insensitive'
        }
      })
    }

    if (validatedFilters.ingredientName) {
      searchConditions.push({
        ingredients: {
          some: {
            materialName: {
              contains: validatedFilters.ingredientName,
              mode: 'insensitive'
            }
          }
        }
      })
    }

    if (validatedFilters.capsuleType) {
      searchConditions.push({
        capsuleType: {
          contains: validatedFilters.capsuleType,
          mode: 'insensitive'
        }
      })
    }

    // Array-based customerServiceId filter
    if (customerServiceIds.length > 0) {
      where.customerServiceId = { in: customerServiceIds }
    }

    if (searchConditions.length > 0) {
      where.AND = searchConditions
    }

    if (validatedFilters.dateTo) {
      where.completionDate = {
        gte: new Date(validatedFilters.dateTo.getFullYear(), validatedFilters.dateTo.getMonth(), validatedFilters.dateTo.getDate()),
        lt: new Date(validatedFilters.dateTo.getFullYear(), validatedFilters.dateTo.getMonth(), validatedFilters.dateTo.getDate() + 1)
      }
    }

    if (validatedFilters.minQuantity !== undefined || validatedFilters.maxQuantity !== undefined) {
      where.productionQuantity = {}
      if (validatedFilters.minQuantity !== undefined) {
        where.productionQuantity.gte = validatedFilters.minQuantity
      }
      if (validatedFilters.maxQuantity !== undefined) {
        where.productionQuantity.lte = validatedFilters.maxQuantity
      }
    }

    // Status filter - support array-based filtering
    if (validStatuses.length > 0) {
      where.status = { in: validStatuses }
    } else if (validatedFilters.status) {
      // Single status filter for backward compatibility
      where.status = validatedFilters.status as ProductionOrderStatus
    } else if (validatedFilters.isCompleted !== undefined) {
      // Fallback to isCompleted filter if status is not specified
      if (validatedFilters.isCompleted) {
        where.completionDate = { not: null }
      } else {
        where.completionDate = null
      }
    }

    const skip = (validatedFilters.page - 1) * validatedFilters.limit

    // Check if using default sort (no custom filters, default sortBy)
    // Only apply special status-based sorting when no filters are applied
    const isDefaultSort = 
      validatedFilters.sortBy === 'completionDate' &&
      validatedFilters.sortOrder === 'desc' &&
      !validatedFilters.customerName &&
      !validatedFilters.productName &&
      !validatedFilters.ingredientName &&
      !validatedFilters.capsuleType &&
      !validatedFilters.dateTo &&
      validatedFilters.minQuantity === undefined &&
      validatedFilters.maxQuantity === undefined &&
      validatedFilters.isCompleted === undefined &&
      validatedFilters.status === undefined

    const orderBy: Prisma.ProductionOrderOrderByWithRelationInput[] = []

    // For default sort, prioritize by status: IN_PROGRESS -> NOT_STARTED -> COMPLETED
    if (isDefaultSort) {
      // Sort by completionDate DESC (in PostgreSQL, nulls come first in DESC order)
      // This puts IN_PROGRESS and NOT_STARTED (null completionDate) before COMPLETED
      orderBy.push({ completionDate: 'desc' })
      // Then by worklog count descending (IN_PROGRESS has worklogs, NOT_STARTED doesn't)
      // This distinguishes IN_PROGRESS (has worklogs) from NOT_STARTED (no worklogs)
      orderBy.push({ worklogs: { _count: 'desc' } })
      // Finally by createdAt descending as tiebreaker
      orderBy.push({ createdAt: 'desc' })
    } else {
      // For custom sorts, use the requested sorting
      const sortOrder: Prisma.SortOrder = validatedFilters.sortOrder

      switch (validatedFilters.sortBy) {
        case 'customerName':
          orderBy.push({ customerName: sortOrder })
          break
        case 'productName':
          orderBy.push({ productName: sortOrder })
          break
        case 'productionQuantity':
          orderBy.push({ productionQuantity: sortOrder })
          break
        case 'completionDate':
          orderBy.push({ completionDate: sortOrder })
          break
        case 'createdAt':
        default:
          orderBy.push({ createdAt: sortOrder })
          break
      }

      if (validatedFilters.sortBy !== 'createdAt') {
        orderBy.push({ createdAt: 'desc' })
      }
    }

    const [orders, total] = await Promise.all([
      executeWithRetry(() => prisma.productionOrder.findMany({
        where,
        include: {
          ingredients: true,
          customerService: {
            select: {
              id: true,
              nickname: true,
              phoneE164: true
            }
          },
          worklogs: {
            orderBy: { workDate: 'asc' }
          },
          // NEW: Include linked work order
          workOrder: {
            select: {
              id: true,
              jobNumber: true,
              customerName: true,
              workType: true
            }
          }
        },
        orderBy,
        take: validatedFilters.limit,
        skip
      })),
      executeWithRetry(() => prisma.productionOrder.count({ where }))
    ])

    const serializedOrders = orders.map(order => ({
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      completionDate: order.completionDate ? 
        (order.completionDate instanceof Date ? 
          DateTime.fromJSDate(order.completionDate, { zone: 'Asia/Hong_Kong' }).toFormat('yyyy-MM-dd') : 
          order.completionDate) : null,
      worklogs: order.worklogs?.map((log) => ({
        ...log,
        workDate: DateTime.fromJSDate(new Date(log.workDate), { zone: 'Asia/Hong_Kong' }).toFormat('yyyy-MM-dd'),
      })),
      totalWorkUnits: order.worklogs?.reduce((sum, log) => sum + (log.calculatedWorkUnits || 0), 0) ?? 0
    }))

    return jsonSuccess({
      orders: serializedOrders,
      pagination: {
        page: validatedFilters.page,
        limit: validatedFilters.limit,
        total,
        totalPages: Math.ceil(total / validatedFilters.limit)
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30'
      }
    })
  } catch (error) {
    logger.error('載入訂單錯誤', {
      error: error instanceof Error ? error.message : error
    })
    
    // Handle connection errors with 503 status
    if (isConnectionError(error)) {
      return jsonError(503, {
        code: 'DATABASE_UNAVAILABLE',
        message: '數據庫連接失敗，請稍後重試'
      })
    }
    
    return jsonError(500, {
      code: 'ORDERS_FETCH_FAILED',
      message: '載入訂單失敗',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getSessionFromCookie()
    if (!session) {
      return jsonError(401, {
        code: 'UNAUTHORIZED',
        message: '未授權'
      })
    }
    
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const userAgent = request.headers.get('user-agent') || null
    
    const body = await request.json()
    const validatedData = productionOrderSchema.parse(body)
    const { workOrderId, ...orderData } = validatedData
    
    // Verify work order exists if workOrderId provided
    if (workOrderId) {
      const workOrderExists = await executeWithRetry(() => prisma.unifiedWorkOrder.findUnique({
        where: { id: workOrderId },
        select: { id: true }
      }))
      
      if (!workOrderExists) {
        return jsonError(400, {
          code: 'WORK_ORDER_NOT_FOUND',
          message: '指定的工作單不存在'
        })
      }
    }
    
    logger.info('POST /api/orders - Payload validated', {
      hasWorklogs: Array.isArray(orderData.worklogs),
      ingredientCount: orderData.ingredients.length,
      completionDateProvided: Boolean(orderData.completionDate),
      workOrderId: workOrderId || null
    })
    
    // Calculate weights
    const unitWeightMg = orderData.ingredients.reduce(
      (sum, ingredient) => sum + ingredient.unitContentMg,
      0
    )
    const batchTotalWeightMg = unitWeightMg * orderData.productionQuantity
    
    logger.debug('Calculated production order weights', { unitWeightMg, batchTotalWeightMg })
    
    // Calculate status based on worklogs and completionDate
    const completionDateValue = orderData.completionDate ? DateTime.fromFormat(orderData.completionDate, 'yyyy-MM-dd').toJSDate() : null
    const worklogsCount = orderData.worklogs?.length ?? 0
    const status = calculateOrderStatus({
      worklogsCount,
      completionDate: completionDateValue
    })
    
    // Create order and link in same transaction
    const order = await executeWithRetry(() => prisma.$transaction(async (tx) => {
      const newOrder = await tx.productionOrder.create({
        data: {
          ...orderData,
          customerServiceId: orderData.customerServiceId === 'UNASSIGNED' ? null : orderData.customerServiceId,
          completionDate: completionDateValue,
          unitWeightMg,
          batchTotalWeightMg,
          workOrderId: workOrderId || null,  // Link during creation
          status,
          statusUpdatedAt: new Date(),
          ingredients: {
            create: orderData.ingredients.map((ingredient) => ({
              materialName: ingredient.materialName,
              unitContentMg: ingredient.unitContentMg,
              isCustomerProvided: ingredient.isCustomerProvided,
              isCustomerSupplied: ingredient.isCustomerSupplied ?? ingredient.isCustomerProvided,
            })),
          },
          worklogs: orderData.worklogs
            ? {
                create: orderData.worklogs.map((entry) => {
                  const parsed = worklogSchema.parse(entry)
                  const { minutes, units } = calculateWorkUnits({
                    date: parsed.workDate,
                    startTime: parsed.startTime,
                    endTime: parsed.endTime,
                    headcount: Number(parsed.headcount),
                  })

                  return {
                    workDate: parsed.workDate,
                    startTime: parsed.startTime,
                    endTime: parsed.endTime,
                    headcount: Number(parsed.headcount),
                    notes: parsed.notes || null,
                    effectiveMinutes: minutes,
                    calculatedWorkUnits: units,
                  }
                }),
              }
            : undefined,
        },
        include: {
          ingredients: true,
          customerService: {
            select: {
              id: true,
              nickname: true,
              phoneE164: true
            }
          },
          worklogs: true,
          workOrder: {
            select: {
              id: true,
              jobNumber: true,
              customerName: true
            }
          }
        },
      })
      
      return newOrder
    }))

    logger.info('Order created successfully', {
      orderId: order.id,
      customerName: order.customerName,
      worklogCount: order.worklogs?.length ?? 0,
    })

    // Audit log
    const auditContext = await getUserContextFromRequest(request)
    await logAudit({
      action: AuditAction.ORDER_CREATED,
      userId: auditContext.userId,
      phone: auditContext.phone,
      ip: auditContext.ip,
      userAgent: auditContext.userAgent,
      metadata: {
        orderId: order.id,
        customerName: order.customerName,
        productName: order.productName,
        quantity: order.productionQuantity,
        ingredientCount: order.ingredients.length,
        workOrderId: workOrderId || null,
        autoLinked: !!workOrderId
      }
    })
    
    // If auto-linked, also log link creation
    if (workOrderId) {
      await logAudit({
        action: AuditAction.LINK_CREATED,
        userId: auditContext.userId,
        phone: auditContext.phone,
        ip: auditContext.ip,
        userAgent: auditContext.userAgent,
        metadata: {
          sourceType: 'encapsulation-order',
          sourceId: order.id,
          sourceName: order.productName,
          targetType: 'work-order',
          targetId: workOrderId,
          autoCreated: true
        }
      })
    }

    return jsonSuccess({
      order,
    }, { status: 201 })
  } catch (error) {
    logger.error('創建訂單錯誤', {
      name: error instanceof Error ? error.name : '未知',
      message: error instanceof Error ? error.message : '未知錯誤',
      stack: error instanceof Error ? error.stack : undefined,
    })

    // Handle connection errors with 503 status
    if (isConnectionError(error)) {
      return jsonError(503, {
        code: 'DATABASE_UNAVAILABLE',
        message: '數據庫連接失敗，請稍後重試'
      })
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return jsonError(409, {
        code: 'ORDERS_DUPLICATE',
        message: '訂單資料重複，請確認客戶與產品資訊是否已存在。',
        details: error.meta,
      })
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return jsonError(400, {
        code: 'ORDERS_VALIDATION_FAILED',
        message: '訂單資料驗證失敗，請檢查輸入欄位。',
        details: error.message,
      })
    }

    if (error instanceof Error && 'issues' in error) {
      return jsonError(422, {
        code: 'ORDERS_SCHEMA_INVALID',
        message: '提交的資料不符合格式要求。',
        details: error,
      })
    }

    return jsonError(500, {
      code: 'ORDERS_CREATE_FAILED',
      message: '建立訂單時發生錯誤，請稍後再試。',
      details: error instanceof Error ? error.message : String(error),
    })
  }
}

