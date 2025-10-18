'use client'

import { LiquidGlassModal } from '@/components/ui/liquid-glass-modal'
import { AddWorklogForm } from './add-worklog-form'

interface AddWorklogDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddWorklogDialog({ isOpen, onClose, onSuccess }: AddWorklogDialogProps) {
  const handleSuccess = () => {
    onSuccess()
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <LiquidGlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="添加工時記錄"
      className="white-theme"
    >
      <AddWorklogForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </LiquidGlassModal>
  )
}
