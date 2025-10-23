'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Clock, Users, Calendar, FileText, Building2 } from 'lucide-react'
import { calculateWorkUnits } from '@/lib/worklog'
import { useToast } from '@/components/ui/toast-provider'
import { WorklogWithOrder } from '@/types'

const editWorklogSchema = z.object({
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

type EditWorklogFormData = z.infer<typeof editWorklogSchema>

interface EditWorklogFormProps {
  worklog: WorklogWithOrder
  onSuccess: () => void
  onCancel: () => void
}

export function EditWorklogForm({ worklog, onSuccess, onCancel }: EditWorklogFormProps) {
  const { showToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<EditWorklogFormData>({
    resolver: zodResolver(editWorklogSchema),
    defaultValues: {
      workDate: worklog.workDate,
      headcount: worklog.headcount,
      startTime: worklog.startTime,
      endTime: worklog.endTime,
      notes: worklog.notes
    }
  })

  const watchedFields = watch()

  // 计算工时
  const calculatedWorkUnits = (() => {
    if (!watchedFields.workDate || !watchedFields.startTime || !watchedFields.endTime || !watchedFields.headcount) {
      return null
    }
    try {
      const { units } = calculateWorkUnits({
        date: watchedFields.workDate,
        startTime: watchedFields.startTime,
        endTime: watchedFields.endTime,
        headcount: watchedFields.headcount
      })
      return units
    } catch {
      return null
    }
  })()

  const onSubmit = async (data: EditWorklogFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/worklogs/${worklog.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '更新工時記錄失敗')
      }

      showToast({
        title: '更新成功',
        description: '工時記錄已成功更新',
        variant: 'default'
      })

      onSuccess()
    } catch (error) {
      console.error('更新工時記錄錯誤:', error)
      showToast({
        title: '更新失敗',
        description: error instanceof Error ? error.message : '更新工時記錄失敗',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="liquid-glass-card liquid-glass-card-brand">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <span className="text-[--brand-neutral]">編輯工時記錄</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 订单信息（只读） */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              相關訂單
            </Label>
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <div className="text-sm text-neutral-900 font-medium">
                {worklog.order?.productName || '未指派訂單'}
              </div>
              <div className="text-xs text-neutral-600 mt-1">
                客戶：{worklog.order?.customerName || '未填寫'}
              </div>
            </div>
          </div>

          {/* 工作日期 */}
          <div className="space-y-2">
            <Label htmlFor="workDate" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              工作日期 *
            </Label>
            <Input
              id="workDate"
              type="date"
              {...register('workDate')}
              className="liquid-glass-input"
            />
            {errors.workDate && (
              <p className="text-sm text-danger-600">{errors.workDate.message}</p>
            )}
          </div>

          {/* 人数 */}
          <div className="space-y-2">
            <Label htmlFor="headcount" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              人數 *
            </Label>
            <Input
              id="headcount"
              type="number"
              min="1"
              {...register('headcount')}
              className="liquid-glass-input"
            />
            {errors.headcount && (
              <p className="text-sm text-danger-600">{errors.headcount.message}</p>
            )}
          </div>

          {/* 时间范围 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-sm font-medium text-neutral-700">
                開始時間 *
              </Label>
              <Input
                id="startTime"
                type="time"
                {...register('startTime')}
                className="liquid-glass-input"
              />
              {errors.startTime && (
                <p className="text-sm text-danger-600">{errors.startTime.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-sm font-medium text-neutral-700">
                結束時間 *
              </Label>
              <Input
                id="endTime"
                type="time"
                {...register('endTime')}
                className="liquid-glass-input"
              />
              {errors.endTime && (
                <p className="text-sm text-danger-600">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          {/* 工时计算显示 */}
          {calculatedWorkUnits !== null && (
            <div className="p-4 rounded-xl bg-primary-50 border border-primary-200">
              <div className="flex items-center gap-2 text-primary-700">
                <Clock className="w-4 h-4" />
                <span className="font-medium">計算工時：</span>
                <span className="text-lg font-bold">{calculatedWorkUnits.toFixed(1)} 工時</span>
              </div>
            </div>
          )}

          {/* 备注 */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              備註
            </Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="記錄工作內容或特殊情況..."
              className="liquid-glass-input min-h-[80px]"
              maxLength={500}
            />
            {errors.notes && (
              <p className="text-sm text-danger-600">{errors.notes.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          取消
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary-600 hover:bg-primary-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              更新中...
            </>
          ) : (
            '更新記錄'
          )}
        </Button>
      </div>
    </form>
  )
}
