/**
 * Quick Edit Modal Component
 * 
 * Compact modal for editing multiple fields at once:
 * - Person in charge
 * - Work type
 * - Notes/description
 * 
 * Opens from row action button, saves all changes together
 */

'use client'

import { useState } from 'react'
import { LiquidGlassModal } from '@/components/ui/liquid-glass-modal'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Text } from '@/components/ui/text'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { WorkType, WORK_TYPE_LABELS, WorkOrder } from '@/types/work-order'
import { User } from '@/types/work-order'
import { Edit3, Save, X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface QuickEditModalProps {
  workOrder: WorkOrder
  users: User[]
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function QuickEditModal({ workOrder, users, isOpen, onClose, onSuccess }: QuickEditModalProps) {
  const [formData, setFormData] = useState({
    personInChargeId: workOrder.personInChargeId || '',
    workType: workOrder.workType,
    workDescription: workOrder.workDescription || ''
  })

  const queryClient = useQueryClient()

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/work-orders/${workOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personInChargeId: data.personInChargeId || null,
          workType: data.workType,
          workDescription: data.workDescription
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '更新失敗')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] })
      onSuccess?.()
      onClose()
    }
  })

  const handleSubmit = () => {
    updateMutation.mutate(formData)
  }

  const handleCancel = () => {
    // Reset to original values
    setFormData({
      personInChargeId: workOrder.personInChargeId || '',
      workType: workOrder.workType,
      workDescription: workOrder.workDescription || ''
    })
    onClose()
  }

  return (
    <LiquidGlassModal isOpen={isOpen} onClose={handleCancel}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
            <Edit3 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <Text.Primary as="h2" className="text-xl font-bold">
              快速編輯
            </Text.Primary>
            <Text.Tertiary className="text-sm">
              {workOrder.customerName} - {workOrder.jobNumber || '無編號'}
            </Text.Tertiary>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Person in Charge */}
          <div>
            <Text.Primary as="label" className="block text-sm font-medium mb-2">
              負責人
            </Text.Primary>
            <Select
              value={formData.personInChargeId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, personInChargeId: value }))}
              disabled={updateMutation.isPending}
            >
              <SelectTrigger className="transition-apple">
                <SelectValue placeholder="選擇負責人" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">未指定</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.nickname || user.phoneE164}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Work Type */}
          <div>
            <Text.Primary as="label" className="block text-sm font-medium mb-2">
              工作類型
            </Text.Primary>
            <Select
              value={formData.workType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, workType: value as WorkType }))}
              disabled={updateMutation.isPending}
            >
              <SelectTrigger className="transition-apple">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(WORK_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Work Description */}
          <div>
            <Text.Primary as="label" className="block text-sm font-medium mb-2">
              工作描述
            </Text.Primary>
            <Textarea
              value={formData.workDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, workDescription: e.target.value }))}
              placeholder="輸入工作描述..."
              rows={4}
              disabled={updateMutation.isPending}
              className="transition-apple resize-none"
            />
            <Text.Tertiary className="text-xs mt-1">
              {formData.workDescription.length} / 1000 字元
            </Text.Tertiary>
          </div>
        </div>

        {/* Error Message */}
        {updateMutation.isError && (
          <div className="mt-4 p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
            <Text.Danger className="text-sm">
              {updateMutation.error instanceof Error ? updateMutation.error.message : '更新失敗，請稍後重試'}
            </Text.Danger>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={updateMutation.isPending}
            className="transition-apple"
          >
            <X className="h-4 w-4 mr-2" />
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white transition-apple min-w-[120px] justify-center"
          >
            {updateMutation.isPending ? (
              <div className="flex items-center">
                <LoadingSpinner size="sm" className="mr-2" />
                <span>儲存中...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <Save className="h-4 w-4 mr-2" />
                <span>儲存變更</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </LiquidGlassModal>
  )
}

