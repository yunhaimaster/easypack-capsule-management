import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { jsonSuccess, jsonError } from '@/lib/api-response'
import { DateTime } from 'luxon'
import { calculateWorkUnits } from '@/lib/worklog'
import { logAudit } from '@/lib/audit'
import { getUserContextFromRequest } from '@/lib/audit-context'
import { AuditAction } from '@prisma/client'
import Papa from 'papaparse'

export const dynamic = 'force-dynamic'
export const revalidate = 180 // 3 minutes

const worklogFilterSchema = z.object({
  orderKeyword: z.string().optional(),
  notesKeyword: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries())
    const filters = worklogFilterSchema.parse(params)

    const where: any = {}

    if (filters.orderKeyword) {
      where.order = {
        OR: [
          { productName: { contains: filters.orderKeyword, mode: 'insensitive' } },
          { customerName: { contains: filters.orderKeyword, mode: 'insensitive' } },
        ],
      }
    }

    if (filters.notesKeyword) {
      where.notes = {
        contains: filters.notesKeyword,
        mode: 'insensitive',
      }
    }

    if (filters.dateFrom || filters.dateTo) {
      where.workDate = {}
      if (filters.dateFrom) {
        where.workDate.gte = new Date(filters.dateFrom)
      }
      if (filters.dateTo) {
        where.workDate.lte = new Date(filters.dateTo)
      }
    }

    const skip = (filters.page - 1) * filters.limit

    const [worklogs, total] = await Promise.all([
      prisma.orderWorklog.findMany({
        where,
        orderBy: { workDate: filters.sortOrder },
        include: {
          order: {
            select: {
              id: true,
              productName: true,
              customerName: true,
            },
          },
        },
        skip,
        take: filters.limit,
      }),
      prisma.orderWorklog.count({ where }),
    ])

    return jsonSuccess({
      worklogs: worklogs.map((log) => ({
        ...log,
        workDate: DateTime.fromJSDate(log.workDate, { zone: 'Asia/Hong_Kong' }).toFormat('yyyy-MM-dd'),
        createdAt: log.createdAt.toISOString(),
        updatedAt: log.updatedAt.toISOString(),
      })),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    })
  } catch (error) {
    logger.error('載入工時紀錄錯誤', {
      error: error instanceof Error ? error.message : String(error),
    })

    return jsonError(500, {
      code: 'WORKLOG_FETCH_FAILED',
      message: '載入工時紀錄失敗',
      details: error instanceof Error ? error.message : String(error),
    })
  }
}

const exportSchema = z.object({
  format: z.enum(['csv', 'pdf']).default('csv'),
  filters: worklogFilterSchema.partial().optional(),
})

const createWorklogSchema = z.object({
  orderId: z.string().min(1, '訂單ID不能為空'),
  workDate: z.string().min(1, '工作日期必須填寫'),
  headcount: z.coerce.number().int('人數必須為整數').min(1, '人數至少為 1'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, '開始時間格式錯誤'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, '結束時間格式錯誤'),
  notes: z.string().max(500, '備註不能超過 500 字').optional().nullable()
}).refine((data) => {
  const start = data.startTime.split(':').map(Number)
  const end = data.endTime.split(':').map(Number)
  const startMinutes = start[0] * 60 + start[1]
  const endMinutes = end[0] * 60 + end[1]
  return endMinutes > startMinutes
}, {
  message: '結束時間必須晚於開始時間',
  path: ['endTime']
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 检查是否为创建工时记录的请求
    if (body.orderId) {
      const data = createWorklogSchema.parse(body)
      
      // 验证订单存在
      const order = await prisma.productionOrder.findUnique({
        where: { id: data.orderId },
        select: { id: true }
      })
      
      if (!order) {
        return jsonError(404, {
          code: 'ORDER_NOT_FOUND',
          message: '訂單不存在',
        })
      }
      
      // 计算工时
      const { minutes, units } = calculateWorkUnits({
        date: data.workDate,
        startTime: data.startTime,
        endTime: data.endTime,
        headcount: data.headcount
      })
      
      // 创建工时记录
      const worklog = await prisma.orderWorklog.create({
        data: {
          orderId: data.orderId,
          workDate: new Date(data.workDate),
          headcount: data.headcount,
          startTime: data.startTime,
          endTime: data.endTime,
          notes: data.notes,
          effectiveMinutes: minutes,
          calculatedWorkUnits: units
        },
        include: {
          order: {
            select: {
              id: true,
              customerName: true,
              productName: true
            }
          }
        }
      })

      // Get user context and log worklog creation
      const context = await getUserContextFromRequest(request)
      await logAudit({
        action: AuditAction.WORKLOG_CREATED,
        userId: context.userId,
        phone: context.phone,
        ip: context.ip,
        userAgent: context.userAgent,
        metadata: {
          worklogId: worklog.id,
          orderId: data.orderId,
          productName: worklog.order.productName,
          workUnits: units,
          headcount: data.headcount
        }
      })
      
      return jsonSuccess({
        worklog: {
          ...worklog,
          workDate: DateTime.fromJSDate(worklog.workDate, { zone: 'Asia/Hong_Kong' }).toFormat('yyyy-MM-dd'),
          createdAt: worklog.createdAt.toISOString(),
          updatedAt: worklog.updatedAt.toISOString(),
        }
      })
    }
    
    // 原有的导出功能
    const { format, filters } = exportSchema.parse(body)

    const where: any = {}

    if (filters?.orderKeyword) {
      where.order = {
        OR: [
          { productName: { contains: filters.orderKeyword, mode: 'insensitive' } },
          { customerName: { contains: filters.orderKeyword, mode: 'insensitive' } },
        ],
      }
    }

    if (filters?.notesKeyword) {
      where.notes = {
        contains: filters.notesKeyword,
        mode: 'insensitive',
      }
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.workDate = {}
      if (filters.dateFrom) {
        where.workDate.gte = new Date(filters.dateFrom)
      }
      if (filters.dateTo) {
        where.workDate.lte = new Date(filters.dateTo)
      }
    }

    const worklogs = await prisma.orderWorklog.findMany({
      where,
      orderBy: { workDate: filters?.sortOrder || 'desc' },
      include: {
        order: {
          select: {
            productName: true,
            customerName: true,
          },
        },
      },
    })

    if (format === 'csv') {
      const headers = new Headers({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="worklogs-${Date.now()}.csv"`,
      })

      // Prepare data for CSV export
      const csvData = worklogs.map((log) => ({
        日期: DateTime.fromJSDate(log.workDate, { zone: 'Asia/Hong_Kong' }).toFormat('yyyy-MM-dd'),
        訂單: log.order?.productName || '-',
        客戶: log.order?.customerName || '-',
        開始: log.startTime,
        結束: log.endTime,
        人數: log.headcount,
        工時: log.calculatedWorkUnits ?? '-',
        備註: log.notes || '',
      }))

      // Generate CSV using PapaParse for proper escaping
      const csv = Papa.unparse(csvData, {
        header: true,
        quotes: true, // Quote all fields for safety
        quoteChar: '"',
        escapeChar: '"',
        delimiter: ',',
        newline: '\r\n' // Windows-style line endings for better Excel compatibility
      })

      // Add UTF-8 BOM for proper Chinese character display in Excel
      const csvContent = '\uFEFF' + csv
      return new Response(csvContent, { headers })
    }

    return jsonError(400, {
      code: 'WORKLOG_EXPORT_UNSUPPORTED',
      message: '目前僅支援匯出 CSV 格式',
    })
  } catch (error) {
    logger.error('匯出工時錯誤', {
      error: error instanceof Error ? error.message : String(error),
    })

    return jsonError(500, {
      code: 'WORKLOG_EXPORT_FAILED',
      message: '匯出工時失敗',
      details: error instanceof Error ? error.message : String(error),
    })
  }
}

