'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Clock, Users, Calendar, FileText } from 'lucide-react'
import { calculateWorkUnits } from '@/lib/worklog'
import { useToast } from '@/components/ui/toast-provider'

const addWorklogSchema = z.object({
  orderId: z.string().min(1, '請選擇訂單'),
  workDate: z.string().min(1, '工作日期必須填寫'),
  headcount: z.coerce.number().int('人數必須為整數').min(1, '人數至少為 1'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, '開始時間格式錯誤'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, '結束時間格式錯誤'),
  notes: z.string().max(500, '備註不能超過 500 字').optional()
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

type AddWorklogFormData = z.infer<typeof addWorklogSchema>

interface IncompleteOrder {
  id: string
  customerName: string
  productName: string
  displayName: string
}

interface AddWorklogFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function AddWorklogForm({ onSuccess, onCancel }: AddWorklogFormProps) {
  const { showToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [incompleteOrders, setIncompleteOrders] = useState<IncompleteOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<AddWorklogFormData>({
    resolver: zodResolver(addWorklogSchema),
    defaultValues: {
      orderId: '',
      workDate: new Date().toISOString().slice(0, 10),
      headcount: 1,
      startTime: '08:30',
      endTime: '17:30',
      notes: ''
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

  // 获取未完成订单
  useEffect(() => {
    const fetchIncompleteOrders = async () => {
      try {
        const response = await fetch('/api/orders/incomplete')
        const result = await response.json()
        
        if (result.success) {
          setIncompleteOrders(result.data.orders)
        } else {
          showToast({
            title: '載入失敗',
            description: result.error || '無法載入未完成訂單',
            variant: 'destructive'
          })
        }
      } catch (error) {
        console.error('載入未完成訂單錯誤:', error)
        showToast({
          title: '載入失敗',
          description: '無法載入未完成訂單',
          variant: 'destructive'
        })
      } finally {
        setLoadingOrders(false)
      }
    }

    fetchIncompleteOrders()
  }, [showToast])

  const onSubmit = async (data: AddWorklogFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/worklogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '添加工時記錄失敗')
      }

      showToast({
        title: '添加成功',
        description: '工時記錄已成功添加',
        variant: 'default'
      })

      onSuccess()
    } catch (error) {
      console.error('添加工時記錄錯誤:', error)
      showToast({
        title: '添加失敗',
        description: error instanceof Error ? error.message : '添加工時記錄失敗',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loadingOrders) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        <span className="ml-2 text-sm text-neutral-600">載入訂單中...</span>
      </div>
    )
  }

  if (incompleteOrders.length === 0) {
    return (
      <Card className="liquid-glass-card liquid-glass-card-brand">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">暫無未完成訂單</h3>
            <p className="text-sm text-neutral-600 mb-6">目前沒有進行中或未完成的訂單可以添加工時記錄。</p>
            <Button variant="outline" onClick={onCancel}>
              取消
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="liquid-glass-card liquid-glass-card-brand">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <span className="text-[--brand-neutral]">添加工時記錄</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 订单选择 */}
          <div className="space-y-2">
            <Label htmlFor="orderId" className="text-sm font-medium text-neutral-700">
              選擇訂單 *
            </Label>
            <Select onValueChange={(value) => setValue('orderId', value)}>
              <SelectTrigger className="liquid-glass-input">
                <SelectValue placeholder="請選擇要添加工時的訂單" />
              </SelectTrigger>
              <SelectContent>
                {incompleteOrders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.orderId && (
              <p className="text-sm text-danger-600">{errors.orderId.message}</p>
            )}
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
              添加中...
            </>
          ) : (
            '添加記錄'
          )}
        </Button>
      </div>
    </form>
  )
}
