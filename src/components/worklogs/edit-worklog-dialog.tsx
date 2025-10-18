'use client'

import { LiquidGlassModal } from '@/components/ui/liquid-glass-modal'
import { EditWorklogForm } from './edit-worklog-form'
import { WorklogWithOrder } from '@/types'

interface EditWorklogDialogProps {
  isOpen: boolean
  worklog: WorklogWithOrder | null
  onClose: () => void
  onSuccess: () => void
}

export function EditWorklogDialog({ isOpen, worklog, onClose, onSuccess }: EditWorklogDialogProps) {
  const handleSuccess = () => {
    onSuccess()
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  if (!worklog) return null

  return (
    <LiquidGlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="編輯工時記錄"
      className="white-theme"
    >
      <EditWorklogForm
        worklog={worklog}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </LiquidGlassModal>
  )
}
