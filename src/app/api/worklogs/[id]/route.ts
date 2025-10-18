import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { jsonSuccess, jsonError } from '@/lib/api-response'
import { DateTime } from 'luxon'
import { calculateWorkUnits } from '@/lib/worklog'

const updateWorklogSchema = z.object({
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const worklogId = params.id
    const body = await request.json()
    const data = updateWorklogSchema.parse(body)

    // 验证工时记录存在
    const existingWorklog = await prisma.orderWorklog.findUnique({
      where: { id: worklogId },
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

    if (!existingWorklog) {
      return jsonError(404, {
        code: 'WORKLOG_NOT_FOUND',
        message: '工時記錄不存在',
      })
    }

    // 计算新的工时
    const { minutes, units } = calculateWorkUnits({
      date: data.workDate,
      startTime: data.startTime,
      endTime: data.endTime,
      headcount: data.headcount
    })

    // 更新工时记录
    const updatedWorklog = await prisma.orderWorklog.update({
      where: { id: worklogId },
      data: {
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

    return jsonSuccess({
      worklog: {
        ...updatedWorklog,
        workDate: DateTime.fromJSDate(updatedWorklog.workDate, { zone: 'Asia/Hong_Kong' }).toFormat('yyyy-MM-dd'),
        createdAt: updatedWorklog.createdAt.toISOString(),
        updatedAt: updatedWorklog.updatedAt.toISOString(),
      }
    })

  } catch (error) {
    logger.error('更新工時記錄錯誤', {
      error: error instanceof Error ? error.message : String(error),
      worklogId: params.id,
    })

    if (error instanceof z.ZodError) {
      return jsonError(400, {
        code: 'VALIDATION_ERROR',
        message: '輸入資料驗證失敗',
        details: error.errors,
      })
    }

    return jsonError(500, {
      code: 'WORKLOG_UPDATE_FAILED',
      message: '更新工時記錄失敗',
      details: error instanceof Error ? error.message : String(error),
    })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const worklogId = params.id

    // 验证工时记录存在
    const existingWorklog = await prisma.orderWorklog.findUnique({
      where: { id: worklogId },
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

    if (!existingWorklog) {
      return jsonError(404, {
        code: 'WORKLOG_NOT_FOUND',
        message: '工時記錄不存在',
      })
    }

    // 删除工时记录
    await prisma.orderWorklog.delete({
      where: { id: worklogId }
    })

    return jsonSuccess({
      message: '工時記錄已刪除',
      deletedWorklog: {
        id: existingWorklog.id,
        workDate: DateTime.fromJSDate(existingWorklog.workDate, { zone: 'Asia/Hong_Kong' }).toFormat('yyyy-MM-dd'),
        order: existingWorklog.order
      }
    })

  } catch (error) {
    logger.error('刪除工時記錄錯誤', {
      error: error instanceof Error ? error.message : String(error),
      worklogId: params.id,
    })

    return jsonError(500, {
      code: 'WORKLOG_DELETE_FAILED',
      message: '刪除工時記錄失敗',
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
