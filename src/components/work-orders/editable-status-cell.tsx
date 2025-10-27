/**
 * Editable Status Cell Component
 * 
 * Allows inline editing of work order status with click-to-edit dropdown
 * - Click badge to edit
 * - Auto-saves on selection
 * - Shows loading state
 * - Optimistic updates
 * - Rollback on error
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { WorkOrderStatus, WORK_ORDER_STATUS_LABELS } from '@/types/work-order'
import { workOrderKeys } from '@/lib/queries/work-orders'
import { Check, X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface EditableStatusCellProps {
  workOrderId: string
  currentStatus: WorkOrderStatus
  onSuccess?: () => void
  onError?: (error: Error) => void
}

// Status to badge variant mapping
const STATUS_VARIANTS: Record<WorkOrderStatus, 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'> = {
  DRAFT: 'secondary',
  PENDING: 'warning',
  NOTIFIED: 'info',
  SHIPPED: 'success',
  COMPLETED: 'success',
  ON_HOLD: 'warning',
  CANCELLED: 'danger'
}

export function EditableStatusCell({ 
  workOrderId, 
  currentStatus, 
  onSuccess,
  onError 
}: EditableStatusCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempStatus, setTempStatus] = useState(currentStatus)
  const selectRef = useRef<HTMLButtonElement>(null)
  const queryClient = useQueryClient()

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (newStatus: WorkOrderStatus) => {
      const response = await fetch(`/api/work-orders/${workOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '更新失敗')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch work orders
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() })
      setIsEditing(false)
      onSuccess?.()
    },
    onError: (error: Error) => {
      // Rollback to original status
      setTempStatus(currentStatus)
      setIsEditing(false)
      onError?.(error)
    }
  })

  // Open select when entering edit mode
  useEffect(() => {
    if (isEditing && selectRef.current) {
      selectRef.current.click()
    }
  }, [isEditing])

  const handleStatusChange = (newStatus: string) => {
    setTempStatus(newStatus as WorkOrderStatus)
    updateMutation.mutate(newStatus as WorkOrderStatus)
  }

  const handleCancel = () => {
    setTempStatus(currentStatus)
    setIsEditing(false)
  }

  // Keyboard support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(true)
    }
    if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing || updateMutation.isPending) {
    return (
      <div className="relative">
        <Select
          value={tempStatus}
          onValueChange={handleStatusChange}
          disabled={updateMutation.isPending}
        >
          <SelectTrigger 
            ref={selectRef}
            className="h-7 text-xs min-w-[100px] focus:ring-2 focus:ring-primary-500"
            aria-label="編輯狀態"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(WORK_ORDER_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key} className="text-xs">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {updateMutation.isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-primary/80 rounded">
            <LoadingSpinner size="sm" />
          </div>
        )}

        {!updateMutation.isPending && (
          <button
            onClick={handleCancel}
            className="absolute -right-6 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            aria-label="取消"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      onKeyDown={handleKeyDown}
      className="group relative"
      aria-label={`編輯狀態，目前為 ${WORK_ORDER_STATUS_LABELS[currentStatus]}`}
      role="button"
      tabIndex={0}
    >
      <Badge 
        variant={STATUS_VARIANTS[currentStatus]}
        className="cursor-pointer transition-all group-hover:ring-2 group-hover:ring-primary-300 dark:group-hover:ring-primary-600 group-hover:shadow-sm"
      >
        {WORK_ORDER_STATUS_LABELS[currentStatus]}
      </Badge>
      
      {/* Edit indicator on hover */}
      <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="h-3 w-3 rounded-full bg-primary-500 flex items-center justify-center">
          <span className="text-[8px] text-white">✎</span>
        </div>
      </div>
    </button>
  )
}

