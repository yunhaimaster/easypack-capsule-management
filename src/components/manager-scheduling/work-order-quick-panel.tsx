/**
 * Work Order Quick Panel Component
 * 
 * Displays work order details in a side drawer without leaving the page.
 * Supports viewing and editing all fields.
 */

'use client'

import { useState, useEffect } from 'react'
import { ManagerSchedulingEntry } from '@/types/manager-scheduling'
import { WORK_TYPE_LABELS } from '@/types/work-order'
import { QuickViewDrawer } from '@/components/ui/quick-view-drawer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast-provider'
import { ExternalLink, Save, Loader2 } from 'lucide-react'
import { formatDateOnly } from '@/lib/utils'
import Link from 'next/link'

interface WorkOrderQuickPanelProps {
  isOpen: boolean
  onClose: () => void
  entry: ManagerSchedulingEntry | null
  canEdit: boolean
  onSave: (entryId: string, field: string, value: string | number | boolean | null) => Promise<void>
  saving: Set<string>
}

export function WorkOrderQuickPanel({
  isOpen,
  onClose,
  entry,
  canEdit,
  onSave,
  saving
}: WorkOrderQuickPanelProps) {
  const { showToast } = useToast()
  const [editedFields, setEditedFields] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Reset edited fields when entry changes
  useEffect(() => {
    if (entry) {
      const processIssuesValue = entry.processIssues ?? entry.workOrder.capsulationOrder?.processIssues ?? entry.workOrder.productionOrder?.processIssues ?? ''
      const qualityNotesValue = entry.qualityNotes ?? entry.workOrder.capsulationOrder?.qualityNotes ?? entry.workOrder.productionOrder?.qualityNotes ?? ''
      
      setEditedFields({
        processIssues: processIssuesValue,
        qualityNotes: qualityNotesValue,
        workDescription: entry.workOrder.workDescription || '',
        expectedProductionStartDate: entry.expectedProductionStartDate || ''
      })
    }
  }, [entry])

  if (!entry) return null

  const handleFieldChange = (field: string, value: string) => {
    setEditedFields(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveAll = async () => {
    if (!entry) return
    
    setIsSaving(true)
    try {
      // Save all changed fields
      const promises = Object.entries(editedFields).map(([field, value]) => {
        const originalValue = field === 'processIssues' 
          ? (entry.processIssues ?? entry.workOrder.capsulationOrder?.processIssues ?? entry.workOrder.productionOrder?.processIssues ?? '')
          : field === 'qualityNotes'
          ? (entry.qualityNotes ?? entry.workOrder.capsulationOrder?.qualityNotes ?? entry.workOrder.productionOrder?.qualityNotes ?? '')
          : field === 'workDescription'
          ? (entry.workOrder.workDescription || '')
          : (entry.expectedProductionStartDate || '')
        
        if (value !== originalValue) {
          return onSave(entry.id, field, value)
        }
        return Promise.resolve()
      })
      
      await Promise.all(promises)
      showToast({ title: '儲存成功' })
    } catch (error) {
      showToast({
        title: '儲存失敗',
        description: error instanceof Error ? error.message : '未知錯誤',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = Object.entries(editedFields).some(([field, value]) => {
    const originalValue = field === 'processIssues' 
      ? (entry.processIssues ?? entry.workOrder.capsulationOrder?.processIssues ?? entry.workOrder.productionOrder?.processIssues ?? '')
      : field === 'qualityNotes'
      ? (entry.qualityNotes ?? entry.workOrder.capsulationOrder?.qualityNotes ?? entry.workOrder.productionOrder?.qualityNotes ?? '')
      : field === 'workDescription'
      ? (entry.workOrder.workDescription || '')
      : (entry.expectedProductionStartDate || '')
    
    return value !== originalValue
  })

  const processIssuesValue = entry.processIssues ?? entry.workOrder.capsulationOrder?.processIssues ?? entry.workOrder.productionOrder?.processIssues ?? ''
  const qualityNotesValue = entry.qualityNotes ?? entry.workOrder.capsulationOrder?.qualityNotes ?? entry.workOrder.productionOrder?.qualityNotes ?? ''

  return (
    <QuickViewDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={entry.workOrder.customerName}
    >
      <div className="p-6 space-y-6">
        {/* Header Info */}
        <div className="flex items-center gap-3">
          <Badge 
            variant={
              entry.workOrder.workType === 'PRODUCTION' ? 'success' :
              entry.workOrder.workType === 'PRODUCTION_PACKAGING' ? 'info' :
              'outline'
            }
          >
            {WORK_TYPE_LABELS[entry.workOrder.workType]}
          </Badge>
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            次序: {entry.priority}
          </span>
        </div>

        {/* Basic Info Card */}
        <Card className="liquid-glass-card">
          <CardContent className="liquid-glass-content p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-500 dark:text-neutral-400">創建日期</span>
                <div className="font-medium text-neutral-900 dark:text-white mt-1">
                  {formatDateOnly(entry.workOrder.createdAt)}
                </div>
              </div>
              <div>
                <span className="text-neutral-500 dark:text-neutral-400">負責人</span>
                <div className="font-medium text-neutral-900 dark:text-white mt-1">
                  {entry.workOrder.personInCharge?.nickname || 
                   entry.workOrder.personInCharge?.phoneE164 || 
                   '未指派'}
                </div>
              </div>
              <div>
                <span className="text-neutral-500 dark:text-neutral-400">生產數量</span>
                <div className="font-medium text-neutral-900 dark:text-white mt-1">
                  {entry.workOrder.productionQuantity || 0}
                </div>
              </div>
              <div>
                <span className="text-neutral-500 dark:text-neutral-400">物料狀態</span>
                <div className="mt-1">
                  <Badge variant={entry.workOrder.productionMaterialsReady ? 'success' : 'warning'}>
                    {entry.workOrder.productionMaterialsReady ? '已齊' : '未齊'}
                  </Badge>
                </div>
              </div>
              {entry.workOrder.expectedProductionMaterialsDate && (
                <div className="col-span-2">
                  <span className="text-neutral-500 dark:text-neutral-400">預計物料到齊日期</span>
                  <div className="font-medium text-neutral-900 dark:text-white mt-1">
                    {formatDateOnly(entry.workOrder.expectedProductionMaterialsDate)}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Editable Fields */}
        <div className="space-y-4">
          {/* Process Issues */}
          <div>
            <Label htmlFor="processIssues" className="text-sm font-medium mb-2 block">
              製程問題
            </Label>
            <Textarea
              id="processIssues"
              value={editedFields.processIssues || ''}
              onChange={(e) => handleFieldChange('processIssues', e.target.value)}
              disabled={!canEdit}
              className="min-h-[120px] resize-none"
              placeholder="請輸入製程問題..."
            />
            {processIssuesValue && processIssuesValue !== editedFields.processIssues && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                來源：{entry.workOrder.capsulationOrder ? '膠囊訂單' : '生產訂單'}
              </p>
            )}
          </div>

          {/* Quality Notes */}
          <div>
            <Label htmlFor="qualityNotes" className="text-sm font-medium mb-2 block">
              品質備註
            </Label>
            <Textarea
              id="qualityNotes"
              value={editedFields.qualityNotes || ''}
              onChange={(e) => handleFieldChange('qualityNotes', e.target.value)}
              disabled={!canEdit}
              className="min-h-[120px] resize-none"
              placeholder="請輸入品質備註..."
            />
            {qualityNotesValue && qualityNotesValue !== editedFields.qualityNotes && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                來源：{entry.workOrder.capsulationOrder ? '膠囊訂單' : '生產訂單'}
              </p>
            )}
          </div>

          {/* Work Description */}
          <div>
            <Label htmlFor="workDescription" className="text-sm font-medium mb-2 block">
              工作描述
            </Label>
            <Textarea
              id="workDescription"
              value={editedFields.workDescription || ''}
              onChange={(e) => handleFieldChange('workDescription', e.target.value)}
              disabled={!canEdit}
              className="min-h-[120px] resize-none"
              placeholder="請輸入工作描述..."
            />
          </div>

          {/* Expected Production Start Date */}
          <div>
            <Label htmlFor="expectedProductionStartDate" className="text-sm font-medium mb-2 block">
              預計開產時間
            </Label>
            <Textarea
              id="expectedProductionStartDate"
              value={editedFields.expectedProductionStartDate || ''}
              onChange={(e) => handleFieldChange('expectedProductionStartDate', e.target.value)}
              disabled={!canEdit}
              className="min-h-[80px] resize-none"
              placeholder="例如：2025/05/15 或 視物料情況..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          {canEdit && hasChanges && (
            <Button
              onClick={handleSaveAll}
              disabled={isSaving || saving.has(entry.id)}
              className="w-full"
            >
              {isSaving || saving.has(entry.id) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  儲存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  儲存變更
                </>
              )}
            </Button>
          )}
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              asChild
            >
              <Link href={`/work-orders/${entry.workOrder.id}`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                工作單頁面
              </Link>
            </Button>
            
            {entry.workOrder.capsulationOrder && (
              <Button
                variant="outline"
                className="flex-1"
                asChild
              >
                <Link href={`/work-orders/${entry.workOrder.id}#capsulation`} target="_blank">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  膠囊訂單
                </Link>
              </Button>
            )}
            
            {entry.workOrder.productionOrder && !entry.workOrder.capsulationOrder && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(`/orders/${entry.workOrder.productionOrder!.id}`, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                生產訂單
              </Button>
            )}
          </div>
          
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full"
          >
            關閉
          </Button>
        </div>
      </div>
    </QuickViewDrawer>
  )
}

