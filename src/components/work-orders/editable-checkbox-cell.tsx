/**
 * Editable Checkbox Cell Component
 * 
 * Allows inline toggling of boolean fields (material ready, production started)
 * - Click to toggle
 * - Auto-saves immediately
 * - Shows loading state
 * - Optimistic updates
 * - Rollback on error
 */

'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Circle } from 'lucide-react'

interface EditableCheckboxCellProps {
  workOrderId: string
  field: 'productionMaterialsReady' | 'packagingMaterialsReady' | 'productionStarted'
  currentValue: boolean
  label: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function EditableCheckboxCell({
  workOrderId,
  field,
  currentValue,
  label,
  onSuccess,
  onError
}: EditableCheckboxCellProps) {
  const [tempValue, setTempValue] = useState(currentValue)
  const queryClient = useQueryClient()

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (newValue: boolean) => {
      const response = await fetch(`/api/work-orders/${workOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newValue })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '更新失敗')
      }

      return response.json()
    },
    onMutate: async (newValue) => {
      // Optimistic update
      setTempValue(newValue)
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['workOrders'] })
      onSuccess?.()
    },
    onError: (error: Error) => {
      // Rollback
      setTempValue(currentValue)
      onError?.(error)
    }
  })

  const handleToggle = () => {
    const newValue = !tempValue
    updateMutation.mutate(newValue)
  }

  // Keyboard support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle()
    }
  }

  if (updateMutation.isPending) {
    return (
      <div className="flex items-center gap-2">
        <LoadingSpinner size="sm" />
        <span className="text-xs text-neutral-500 dark:text-neutral-400">更新中...</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className="group flex items-center gap-2 cursor-pointer hover:bg-surface-secondary/50 dark:hover:bg-elevation-1 px-2 py-1 rounded transition-all"
      aria-label={`${label}，目前為 ${tempValue ? '是' : '否'}，點擊切換`}
      role="checkbox"
      aria-checked={tempValue}
      tabIndex={0}
    >
      {tempValue ? (
        <CheckCircle className="h-4 w-4 text-success-600 flex-shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-neutral-400 dark:text-neutral-600 flex-shrink-0 group-hover:text-neutral-500" />
      )}
      <span className={`text-xs ${tempValue ? 'text-success-600 font-medium' : 'text-neutral-500 dark:text-neutral-400'}`}>
        {tempValue ? '✓' : '—'}
      </span>
    </button>
  )
}

