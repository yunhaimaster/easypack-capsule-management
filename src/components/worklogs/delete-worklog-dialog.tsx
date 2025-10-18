'use client'

import { useState } from 'react'
import { LiquidGlassModal } from '@/components/ui/liquid-glass-modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, AlertTriangle, Clock, Calendar, Building2, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'
import { WorklogWithOrder } from '@/types'
import { DateTime } from 'luxon'

interface DeleteWorklogDialogProps {
  isOpen: boolean
  worklog: WorklogWithOrder | null
  onClose: () => void
  onSuccess: () => void
}

export function DeleteWorklogDialog({ isOpen, worklog, onClose, onSuccess }: DeleteWorklogDialogProps) {
  const { showToast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const formatWorkDate = (date: string) => {
    const dt = DateTime.fromISO(date, { zone: 'Asia/Hong_Kong' })
    return dt.isValid ? dt.toFormat('yyyy/MM/dd (ccc)', { locale: 'zh-Hant' }) : date
  }

  const handleDelete = async () => {
    if (!worklog) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/worklogs/${worklog.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '刪除工時記錄失敗')
      }

      showToast({
        title: '刪除成功',
        description: '工時記錄已成功刪除',
        variant: 'default'
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error('刪除工時記錄錯誤:', error)
      showToast({
        title: '刪除失敗',
        description: error instanceof Error ? error.message : '刪除工時記錄失敗',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    onClose()
  }

  if (!worklog) return null

  return (
    <LiquidGlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="確認刪除工時記錄"
      className="white-theme"
    >
      <div className="space-y-6">
        {/* 警告提示 */}
        <div className="p-4 rounded-xl bg-danger-50 border border-danger-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-danger-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-danger-800">這項操作無法復原</h3>
              <p className="text-sm text-danger-700 mt-1">
                刪除後，該工時記錄將永久移除，且無法恢復。
              </p>
            </div>
          </div>
        </div>

        {/* 工时记录详情 */}
        <Card className="liquid-glass-card liquid-glass-card-subtle">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-neutral-500" />
              <span className="font-medium text-neutral-900">工時日期</span>
              <span className="text-neutral-600">{formatWorkDate(worklog.workDate)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-neutral-500" />
              <span className="font-medium text-neutral-900">訂單</span>
              <span className="text-neutral-600">{worklog.order?.productName || '未指派訂單'}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-neutral-500" />
              <span className="font-medium text-neutral-900">工時</span>
              <span className="text-neutral-600">
                {worklog.startTime} - {worklog.endTime} · {worklog.headcount} 人 · {worklog.calculatedWorkUnits.toFixed(1)} 工時
              </span>
            </div>

            {worklog.notes && (
              <div className="pt-2 border-t border-neutral-200">
                <p className="text-xs text-neutral-500 mb-1">備註</p>
                <p className="text-sm text-neutral-700">{worklog.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            取消
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-danger-600 hover:bg-danger-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                刪除中...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                確認刪除
              </>
            )}
          </Button>
        </div>
      </div>
    </LiquidGlassModal>
  )
}
