import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { productionOrderSchema, searchFiltersSchema, worklogSchema } from '@/lib/validations'
import { SearchFilters } from '@/types'
import { calculateWorkUnits } from '@/lib/worklog'
import { DateTime } from 'luxon'
import { logger } from '@/lib/logger'
import { jsonSuccess, jsonError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    
    const filters: SearchFilters = {
      customerName: searchParams.get('customerName') || undefined,
      productName: searchParams.get('productName') || undefined,
      ingredientName: searchParams.get('ingredientName') || undefined,
      capsuleType: searchParams.get('capsuleType') || undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      minQuantity: searchParams.get('minQuantity') ? parseInt(searchParams.get('minQuantity')!) : undefined,
      maxQuantity: searchParams.get('maxQuantity') ? parseInt(searchParams.get('maxQuantity')!) : undefined,
      isCompleted: searchParams.get('isCompleted') ? searchParams.get('isCompleted') === 'true' : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '25'),
      sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc'
    }

    const validatedFilters = searchFiltersSchema.parse(filters)
    
    const where: Prisma.ProductionOrderWhereInput = {}

    const searchConditions: Prisma.ProductionOrderWhereInput[] = []

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

    if (validatedFilters.isCompleted !== undefined) {
      if (validatedFilters.isCompleted) {
        where.completionDate = { not: null }
      } else {
        where.completionDate = null
      }
    }

    const skip = (validatedFilters.page - 1) * validatedFilters.limit

    const orderBy: Prisma.ProductionOrderOrderByWithRelationInput[] = [
      { completionDate: 'asc' },
      { worklogs: { _count: 'desc' } }
    ]

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

    const [orders, total] = await Promise.all([
      prisma.productionOrder.findMany({
        where,
        include: {
          ingredients: true,
          worklogs: {
            orderBy: { workDate: 'asc' }
          }
        },
        orderBy,
        take: validatedFilters.limit,
        skip
      }),
      prisma.productionOrder.count({ where })
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
    })
  } catch (error) {
    logger.error('載入訂單錯誤', {
      error: error instanceof Error ? error.message : error
    })
    return jsonError(500, {
      code: 'ORDERS_FETCH_FAILED',
      message: '載入訂單失敗',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = productionOrderSchema.parse(body)
    logger.info('POST /api/orders - Payload validated', {
      hasWorklogs: Array.isArray((validatedData as typeof validatedData & { worklogs?: unknown[] }).worklogs),
      ingredientCount: validatedData.ingredients.length,
      completionDateProvided: Boolean(validatedData.completionDate)
    })
    
    // Calculate weights
    const unitWeightMg = validatedData.ingredients.reduce(
      (sum, ingredient) => sum + ingredient.unitContentMg,
      0
    )
    const batchTotalWeightMg = unitWeightMg * validatedData.productionQuantity
    
    logger.debug('Calculated production order weights', { unitWeightMg, batchTotalWeightMg })
    
    const order = await prisma.productionOrder.create({
      data: {
        ...validatedData,
        completionDate: validatedData.completionDate ? DateTime.fromFormat(validatedData.completionDate, 'yyyy-MM-dd').toJSDate() : null,
        unitWeightMg,
        batchTotalWeightMg,
        ingredients: {
          create: validatedData.ingredients.map((ingredient) => ({
            materialName: ingredient.materialName,
            unitContentMg: ingredient.unitContentMg,
            isCustomerProvided: ingredient.isCustomerProvided,
            isCustomerSupplied: ingredient.isCustomerSupplied ?? ingredient.isCustomerProvided,
          })),
        },
        worklogs: validatedData.worklogs
          ? {
              create: validatedData.worklogs.map((entry) => {
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
        worklogs: true,
      },
    })

    logger.info('Order created successfully', {
      orderId: order.id,
      customerName: order.customerName,
      worklogCount: order.worklogs?.length ?? 0,
    })

    return jsonSuccess({
      order,
    }, { status: 201 })
  } catch (error) {
    logger.error('創建訂單錯誤', {
      name: error instanceof Error ? error.name : '未知',
      message: error instanceof Error ? error.message : '未知錯誤',
      stack: error instanceof Error ? error.stack : undefined,
    })

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

