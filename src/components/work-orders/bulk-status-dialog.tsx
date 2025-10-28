/**
 * Bulk Status Change Dialog
 * 
 * Modal dialog for changing the status of multiple work orders at once
 * 
 * Features:
 * - Status selector with all available statuses
 * - Confirmation step
 * - Loading state during API call
 * - Success/error feedback
 */

'use client'

import { useState } from 'react'
import { LiquidGlassModal } from '@/components/ui/liquid-glass-modal'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { WorkOrderStatus, WORK_ORDER_STATUS_LABELS } from '@/types/work-order'

interface BulkStatusDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedCount: number
  onConfirm: (newStatus: WorkOrderStatus | null) => Promise<void>
}

export function BulkStatusDialog({ 
  isOpen, 
  onClose, 
  selectedCount, 
  onConfirm 
}: BulkStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<WorkOrderStatus | 'null' | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!selectedStatus) {
      setError('請選擇新狀態')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Convert "null" string to actual null for API
      const statusValue = selectedStatus === 'null' ? null : (selectedStatus as WorkOrderStatus)
      await onConfirm(statusValue)
      // Success - parent will handle closing and showing success message
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失敗，請稍後重試')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedStatus('')
      setError(null)
      onClose()
    }
  }

  return (
    <LiquidGlassModal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full">
            <RefreshCw className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white/95">批量變更狀態</h2>
            <p className="text-sm text-neutral-600 dark:text-white/75 mt-1">
              將 {selectedCount} 個工作單變更為新狀態
            </p>
          </div>
        </div>

        {/* Warning Info */}
        <div className="mb-6 p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-warning-700 dark:text-warning-400">
              <p className="font-medium mb-2">注意事項：</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>所有選中的工作單將統一變更為選定的狀態</li>
                <li>狀態變更將被記錄在審計日誌中</li>
                <li>此操作無法撤銷</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Status Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-3">
            選擇新狀態 <span className="text-danger-600">*</span>
          </label>
          <Select
            value={selectedStatus}
            onValueChange={(value) => setSelectedStatus(value as WorkOrderStatus | 'null')}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="請選擇狀態" />
            </SelectTrigger>
            <SelectContent>
              {/* Add ongoing option FIRST */}
              <SelectItem value="null">
                進行中 (取消狀態標記)
              </SelectItem>
              {Object.entries(WORK_ORDER_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
            <p className="text-sm text-danger-700 dark:text-danger-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || !selectedStatus}
            className="bg-primary-600 hover:bg-primary-700"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                變更中...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                確認變更
              </>
            )}
          </Button>
        </div>
      </div>
    </LiquidGlassModal>
  )
}

