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

import { useState, useEffect } from 'react'
import { LiquidGlassModal } from '@/components/ui/liquid-glass-modal'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Text } from '@/components/ui/text'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { WorkType, WORK_TYPE_LABELS, WorkOrder } from '@/types/work-order'
import { User } from '@/types/work-order'
import { Edit3, Save, X } from 'lucide-react'

interface QuickEditModalProps {
  workOrder: WorkOrder
  users: User[]
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function QuickEditModal({ workOrder, users, isOpen, onClose, onSuccess }: QuickEditModalProps) {
  const [formData, setFormData] = useState({
    personInChargeId: workOrder.personInChargeId || 'UNASSIGNED',
    workType: workOrder.workType,
    workDescription: workOrder.workDescription || ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync formData when workOrder changes (when modal opens with different work order)
  useEffect(() => {
    setFormData({
      personInChargeId: workOrder.personInChargeId || 'UNASSIGNED',
      workType: workOrder.workType,
      workDescription: workOrder.workDescription || ''
    })
  }, [workOrder.id, workOrder.personInChargeId, workOrder.workType, workOrder.workDescription])

  const handleSubmit = async () => {
    setIsSaving(true)
    setError(null)
    
    try {
      const payload = {
        personInChargeId: formData.personInChargeId === 'UNASSIGNED' ? null : formData.personInChargeId,
        workType: formData.workType,
        workDescription: formData.workDescription
      }
      
      const response = await fetch(`/api/work-orders/${workOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '更新失敗')
      }

      // Success - call parent's success callback (which will refetch)
      onSuccess?.()
      
    } catch (err) {
      console.error('[QuickEditModal] Save error:', err)
      setError(err instanceof Error ? err.message : '更新失敗，請稍後再試')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset to original values
    setFormData({
      personInChargeId: workOrder.personInChargeId || 'UNASSIGNED',
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
              disabled={isSaving}
            >
              <SelectTrigger className="transition-apple">
                <SelectValue placeholder="選擇負責人" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNASSIGNED">未指定</SelectItem>
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
              disabled={isSaving}
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
              disabled={isSaving}
              className="transition-apple resize-none"
            />
            <Text.Tertiary className="text-xs mt-1">
              {formData.workDescription.length} / 1000 字元
            </Text.Tertiary>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800">
            <Text.Danger className="text-sm">{error}</Text.Danger>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="transition-apple"
          >
            <X className="h-4 w-4 mr-2" />
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white transition-apple min-w-[120px] justify-center"
          >
            {isSaving ? (
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

