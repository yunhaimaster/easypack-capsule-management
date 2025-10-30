/**
 * Manager Scheduling Table Component
 * 
 * Displays scheduling entries in a table with:
 * - 12 columns (priority, processIssues, qualityNotes, createdAt, customerName, etc.)
 * - Drag-drop reordering (MANAGER/ADMIN only)
 * - Inline editing for all editable fields
 * - Responsive design (desktop table, mobile cards)
 * - Real-time sync indicators
 */

'use client'

import { useState, useCallback, useRef, Fragment } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { ManagerSchedulingEntry } from '@/types/manager-scheduling'
import { WorkType, WORK_TYPE_LABELS, WORK_TYPE_SHORT_LABELS } from '@/types/work-order'
import { TableWrapper } from '@/components/ui/table-wrapper'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast-provider'
import { LiquidGlassConfirmModal } from '@/components/ui/liquid-glass-modal'
import { GripVertical, Trash2, Loader2, ExternalLink, ChevronDown, ChevronUp, ChevronsDown, ChevronsUp, AlertCircle, Plus, Calendar, PlayCircle, Clock } from 'lucide-react'
import { formatDateOnly } from '@/lib/utils'
import { SchedulingInlineEdit } from './scheduling-inline-edit'
import { WorkOrderQuickPanel } from './work-order-quick-panel'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface SchedulingTableProps {
  entries: ManagerSchedulingEntry[]
  onEntriesChange: (entries: ManagerSchedulingEntry[]) => void
  canEdit: boolean
  canEditSyncFields: boolean
  canEditPriority: boolean
  onExport?: () => void
}

export function SchedulingTable({ entries, onEntriesChange, canEdit, canEditSyncFields, canEditPriority, onExport }: SchedulingTableProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [quickViewEntry, setQuickViewEntry] = useState<ManagerSchedulingEntry | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  
  const toggleExpand = useCallback((entryId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(entryId)) {
        next.delete(entryId)
      } else {
        next.add(entryId)
      }
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    setExpandedRows(new Set(entries.map(e => e.id)))
  }, [entries])

  const collapseAll = useCallback(() => {
    setExpandedRows(new Set())
  }, [])

  const handleFieldEdit = useCallback(async (
    entryId: string,
    field: string,
    value: string | number | boolean | null
  ) => {
    setSaving(prev => new Set(prev).add(entryId))

    try {
      const response = await fetch(`/api/manager-scheduling/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ [field]: value })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '更新失敗')
      }

      const result = await response.json()
      
      // Update local state
      const updatedEntries = entries.map(entry =>
        entry.id === entryId ? { ...entry, ...result.data } : entry
      )
      
      onEntriesChange(updatedEntries)
      showToast({ title: '更新成功' })
    } catch (error) {
      showToast({
        title: '更新失敗',
        description: error instanceof Error ? error.message : '未知錯誤',
        variant: 'destructive'
      })
    } finally {
      setSaving(prev => {
        const next = new Set(prev)
        next.delete(entryId)
        return next
      })
    }
  }, [entries, onEntriesChange, showToast])

  const handleReorder = useCallback(async (updates: Array<{ id: string; priority: number }>) => {
    try {
      const response = await fetch('/api/manager-scheduling/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ updates })
      })

      if (!response.ok) {
        throw new Error('重新排序失敗')
      }

      // Reload entries to reflect new order
      const reloadResponse = await fetch('/api/manager-scheduling', {
        credentials: 'include',
        cache: 'no-store'
      })
      
      if (reloadResponse.ok) {
        const data = await reloadResponse.json()
        onEntriesChange(data.data?.entries || [])
        showToast({ title: '排序已更新' })
      }
    } catch (error) {
      showToast({
        title: '重新排序失敗',
        description: error instanceof Error ? error.message : '未知錯誤',
        variant: 'destructive'
      })
    }
  }, [onEntriesChange, showToast])

  // Drag and drop handlers for @hello-pangea/dnd
  const handleBeforeDragStart = useCallback((start: any) => {
    if (!canEdit) return
    
    // Lock cell dimensions to prevent layout shifts during drag
    const draggedElement = document.querySelector(`[data-rbd-draggable-id='${start.draggableId}']`)
    if (draggedElement) {
      const cells = draggedElement.querySelectorAll('td')
      cells.forEach((cell) => {
        const computedStyle = window.getComputedStyle(cell)
        cell.style.width = computedStyle.width
        cell.style.boxSizing = 'border-box'
      })
    }
  }, [canEdit])

  const handleDragStart = useCallback(() => {
    if (!canEdit) return
    
    // Add vibration feedback for mobile devices
    if (window.navigator.vibrate) {
      window.navigator.vibrate(100)
    }
  }, [canEdit])

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!canEdit || !result.destination) return

    const { source, destination } = result
    
    // If dropped in the same position, do nothing
    if (source.index === destination.index) return

    // Create new array with reordered entries
    const newEntries = [...entries]
    const [draggedEntry] = newEntries.splice(source.index, 1)
    newEntries.splice(destination.index, 0, draggedEntry)

    // Calculate new priorities (1-based)
    const updates: Array<{ id: string; priority: number }> = newEntries.map((entry, index) => ({
      id: entry.id,
      priority: index + 1
    }))

    // Update local state immediately for better UX
    onEntriesChange(newEntries)

    // Send updates to server
    if (updates.length > 0) {
      await handleReorder(updates)
    }
  }, [canEdit, entries, onEntriesChange, handleReorder])

  const handleDelete = useCallback(async (entryId: string) => {
    setDeleting(entryId)
    try {
      const response = await fetch(`/api/manager-scheduling/${entryId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '刪除失敗')
      }

      // Remove from local state
      const updatedEntries = entries.filter(entry => entry.id !== entryId)
      onEntriesChange(updatedEntries)
      showToast({ title: '已從排單表移除' })
    } catch (error) {
      showToast({
        title: '刪除失敗',
        description: error instanceof Error ? error.message : '未知錯誤',
        variant: 'destructive'
      })
    } finally {
      setDeleting(null)
      setDeleteConfirmId(null)
    }
  }, [entries, onEntriesChange, showToast])

  const allExpanded = entries.length > 0 && entries.every(e => expandedRows.has(e.id))
  const someExpanded = expandedRows.size > 0

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden lg:block space-y-3">
        {/* Actions Bar */}
        {entries.length > 0 && (
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={allExpanded ? collapseAll : expandAll}
              className="gap-2"
            >
              {allExpanded ? (
                <>
                  <ChevronsUp className="h-4 w-4" />
                  收起全部
                </>
              ) : (
                <>
                  <ChevronsDown className="h-4 w-4" />
                  展開全部
                </>
              )}
            </Button>
            {onExport && (
              <Button 
                onClick={onExport}
                size="sm"
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white gap-2"
              >
                匯出排單表
              </Button>
            )}
          </div>
        )}
        
        <DragDropContext onBeforeDragStart={handleBeforeDragStart} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <Droppable 
            droppableId="scheduling-table" 
            isDropDisabled={!canEditPriority}
            renderClone={(provided, snapshot, rubric) => {
              const entry = entries[rubric.source.index]
              return (
                <table style={{ width: '100%', tableLayout: 'fixed' }}>
                  <tbody>
                    <TableRow
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        ...provided.draggableProps.style,
                      }}
                      className="bg-surface-primary dark:bg-surface-primary shadow-lg"
                    >
                  {/* Expand Button */}
                  <TableCell className="w-10">
                    <div className="h-8 w-8" />
                  </TableCell>

                  {/* Priority - NO STICKY */}
                  {canEdit && (
                    <TableCell className="w-16 bg-surface-primary dark:bg-surface-primary">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                          {entry.priority}
                        </span>
                      </div>
                    </TableCell>
                  )}
                  
                  {/* Customer Name */}
                  <TableCell className="w-40">
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                      {entry.workOrder.customerName}
                    </div>
                  </TableCell>
                  
                  {/* Person in Charge */}
                  <TableCell className="w-24 text-sm text-neutral-600 dark:text-neutral-400">
                    {entry.workOrder.personInCharge?.nickname || 
                     entry.workOrder.personInCharge?.phoneE164 || 
                     '未指派'}
                  </TableCell>
                  
                  {/* Expected Production Start Date */}
                  <TableCell className="w-40">
                    <div className="line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                      {entry.expectedProductionStartDate || '-'}
                    </div>
                  </TableCell>
                  
                  {/* Production Materials Ready */}
                  <TableCell className="w-20">
                    <Badge variant={entry.workOrder.productionMaterialsReady ? 'success' : 'warning'}>
                      {entry.workOrder.productionMaterialsReady ? '已齊' : '未齊'}
                    </Badge>
                  </TableCell>
                  
                  {/* Work Type */}
                  <TableCell className="w-28">
                    <Badge 
                      variant={
                        entry.workOrder.workType === 'PRODUCTION' ? 'success' :
                        entry.workOrder.workType === 'PRODUCTION_PACKAGING' ? 'info' :
                        'outline'
                      }
                    >
                      {WORK_TYPE_SHORT_LABELS[entry.workOrder.workType]}
                    </Badge>
                  </TableCell>
                  
                  {/* Actions - NO STICKY */}
                  {canEdit && (
                    <TableCell className="w-16 bg-surface-primary dark:bg-surface-primary">
                      <div className="h-8 w-8" />
                    </TableCell>
                  )}
                </TableRow>
                  </tbody>
                </table>
              )
            }}
          >
            {(provided, snapshot) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="overflow-x-auto">
                <TableWrapper>
                  <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      {canEdit && (
                        <TableHead className="sticky left-10 bg-surface-primary dark:bg-surface-primary shadow-[4px_0_8px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_8px_rgba(0,0,0,0.25)] z-20 w-16">
                          次序
                        </TableHead>
                      )}
                      <TableHead className="w-40">客戶名稱</TableHead>
                      <TableHead className="w-24">負責人</TableHead>
                      <TableHead className="w-40">預計開產時間</TableHead>
                      <TableHead className="w-20">物料已齊</TableHead>
                      <TableHead className="w-28">狀態</TableHead>
{canEdit && (
                        <TableHead className="sticky right-0 bg-surface-primary dark:bg-surface-primary shadow-[-4px_0_8px_rgba(0,0,0,0.05)] dark:shadow-[-4px_0_8px_rgba(0,0,0,0.25)] z-20 w-16">
                          操作
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry, index) => {
                      const isExpanded = expandedRows.has(entry.id)
                      const processIssuesValue = entry.processIssues ?? entry.workOrder.capsulationOrder?.processIssues ?? entry.workOrder.productionOrder?.processIssues ?? ''
                      const qualityNotesValue = entry.qualityNotes ?? entry.workOrder.capsulationOrder?.qualityNotes ?? entry.workOrder.productionOrder?.qualityNotes ?? ''
                      const workDescriptionValue = entry.workOrder.workDescription || ''
                      
                      return (
                        <Draggable
                          key={entry.id}
                          draggableId={entry.id}
                          index={index}
                          isDragDisabled={!canEditPriority}
                        >
                          {(provided, snapshot) => (
                            <Fragment>
                              <TableRow
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "hover:bg-surface-secondary/30 transition-colors cursor-move",
                                  snapshot.isDragging && 'opacity-50'
                                )}
                              >
                      {/* Expand Button */}
                      <TableCell className="w-10">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(entry.id)}
                          className="h-8 w-8 p-0 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                          aria-label={isExpanded ? '收起詳情' : '展開詳情'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>

                      {canEdit && (
                        <TableCell className="sticky left-10 bg-surface-primary dark:bg-surface-primary shadow-[4px_0_8px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_8px_rgba(0,0,0,0.25)] z-20">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-neutral-400" />
                            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                              {entry.priority}
                            </span>
                          </div>
                        </TableCell>
                      )}
                      
                      {/* Customer Name */}
                      <TableCell className="w-40">
                        <button
                          onClick={() => setQuickViewEntry(entry)}
                          className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer underline decoration-dotted underline-offset-4 transition-colors text-left line-clamp-2"
                          title={entry.workOrder.customerName}
                        >
                          {entry.workOrder.customerName}
                        </button>
                      </TableCell>
                      
                      {/* Person in Charge */}
                      <TableCell className="w-24 text-sm text-neutral-600 dark:text-neutral-400">
                        {entry.workOrder.personInCharge?.nickname || 
                         entry.workOrder.personInCharge?.phoneE164 || 
                         '未指派'}
                      </TableCell>
                      
                      {/* Expected Production Start Date */}
                      <TableCell className="w-40">
                        <div className="line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          {entry.expectedProductionStartDate || '-'}
                        </div>
                      </TableCell>
                      
                      {/* Production Materials Ready */}
                      <TableCell className="w-20">
                        <Badge 
                          variant={entry.workOrder.productionMaterialsReady ? 'success' : 'warning'}
                        >
                          {entry.workOrder.productionMaterialsReady ? '已齊' : '未齊'}
                        </Badge>
                      </TableCell>
                      
                      {/* Scheduling Status */}
                      <TableCell className="w-28">
                        {(() => {
                          // No related orders
                          const hasOrders = Boolean(entry.workOrder.capsulationOrder) || Boolean(entry.workOrder.productionOrder)
                          if (!hasOrders) {
                            return (
                              <Badge variant="outline" className="text-xs text-neutral-500 dark:text-white/65">
                                <AlertCircle className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                                無關聯訂單
                              </Badge>
                            )
                          }
                          
                          // Determine scheduling status based on available data
                          const now = new Date()
                          const hasDate = Boolean(entry.expectedProductionStartDate)
                          const date = hasDate && entry.expectedProductionStartDate ? new Date(entry.expectedProductionStartDate) : null
                          const materialsReady = entry.workOrder.productionMaterialsReady
                          
                          let status: 'scheduled' | 'readyToStart' | 'awaitingPreparation' = 'readyToStart'
                          let icon = PlayCircle
                          let label = '可開始'
                          let className = 'text-success-700 dark:text-success-400'
                          
                          if (!materialsReady) {
                            status = 'awaitingPreparation'
                            icon = Clock
                            label = '待準備'
                            className = 'text-warning-700 dark:text-warning-400'
                          } else if (hasDate && date && date > now) {
                            status = 'scheduled'
                            icon = Calendar
                            label = '已排程'
                            className = 'text-info-700 dark:text-info-400'
                          }
                          
                          const Icon = icon
                          return (
                            <Badge variant="outline" className={`inline-flex items-center gap-1 text-xs ${className}`}>
                              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                              {label}
                            </Badge>
                          )
                        })()}
                      </TableCell>
                      
                      {/* Actions */}
                      {canEdit && (
                        <TableCell className="sticky right-0 bg-surface-primary dark:bg-surface-primary shadow-[-4px_0_8px_rgba(0,0,0,0.05)] dark:shadow-[-4px_0_8px_rgba(0,0,0,0.25)] z-20">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmId(entry.id)}
                            disabled={deleting === entry.id}
                            className="h-8 w-8 p-0 text-danger-600 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-900/20"
                            aria-label="刪除"
                          >
                            {deleting === entry.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                    
                    {/* Detail Row (Expanded) */}
                    {isExpanded && (
                      <TableRow className="bg-surface-secondary/20">
                        <TableCell colSpan={canEdit ? 8 : 6} className="p-6">
                          <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-neutral-500 dark:text-neutral-400">創建日期</span>
                                <div className="font-medium text-neutral-900 dark:text-white mt-1">
                                  {formatDateOnly(entry.workOrder.createdAt)}
                                </div>
                              </div>
                              <div>
                                <span className="text-neutral-500 dark:text-neutral-400">生產數量</span>
                                <div className="font-medium text-neutral-900 dark:text-white mt-1">
                                  {entry.workOrder.productionQuantity || 0}
                                </div>
                              </div>
                              <div>
                                <span className="text-neutral-500 dark:text-neutral-400">預計物料到齊</span>
                                <div className="font-medium text-neutral-900 dark:text-white mt-1">
                                  {entry.workOrder.expectedProductionMaterialsDate
                                    ? formatDateOnly(entry.workOrder.expectedProductionMaterialsDate)
                                    : '未設定'}
                                </div>
                              </div>
                            </div>

                            {/* Process Issues */}
                            {processIssuesValue && (
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                                  製程問題
                                </h4>
                                {canEditSyncFields ? (
                                  <SchedulingInlineEdit
                                    entryId={entry.id}
                                    field="processIssues"
                                    value={processIssuesValue}
                                    type="textarea"
                                    canEdit={canEditSyncFields}
                                    onSave={handleFieldEdit}
                                    isLoading={saving.has(entry.id)}
                                  />
                                ) : (
                                  <div className="text-sm text-neutral-700 dark:text-white/90 whitespace-pre-wrap leading-relaxed bg-surface-primary/30 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                                    {processIssuesValue}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Quality Notes */}
                            {qualityNotesValue && (
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                                  品質備註
                                </h4>
                                {canEditSyncFields ? (
                                  <SchedulingInlineEdit
                                    entryId={entry.id}
                                    field="qualityNotes"
                                    value={qualityNotesValue}
                                    type="textarea"
                                    canEdit={canEditSyncFields}
                                    onSave={handleFieldEdit}
                                    isLoading={saving.has(entry.id)}
                                  />
                                ) : (
                                  <div className="text-sm text-neutral-700 dark:text-white/90 whitespace-pre-wrap leading-relaxed bg-surface-primary/30 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                                    {qualityNotesValue}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Work Description */}
                            {workDescriptionValue && (
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                                  工作描述
                                </h4>
                                {canEditSyncFields ? (
                                  <SchedulingInlineEdit
                                    entryId={entry.id}
                                    field="workDescription"
                                    value={workDescriptionValue}
                                    type="textarea"
                                    canEdit={canEditSyncFields}
                                    onSave={handleFieldEdit}
                                    isLoading={saving.has(entry.id)}
                                  />
                                ) : (
                                  <div className="text-sm text-neutral-700 dark:text-white/90 whitespace-pre-wrap leading-relaxed bg-surface-primary/30 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                                    {workDescriptionValue}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Warning and Create Order Button if no order exists */}
                            {!entry.workOrder.capsulationOrder && !entry.workOrder.productionOrder && (
                              <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  <AlertCircle className="h-5 w-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-warning-900 dark:text-warning-200 mb-1">
                                      此工作單尚未關聯訂單
                                    </h4>
                                    <p className="text-sm text-warning-700 dark:text-warning-300 mb-3">
                                      請創建生產訂單或膠囊訂單以繼續流程。
                                    </p>
                                    <Button
                                      size="sm"
                                      onClick={() => router.push(`/orders/new?workOrderId=${entry.workOrder.id}`)}
                                      className="bg-warning-600 hover:bg-warning-700 text-white"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      創建生產訂單
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                              </TableRow>
                            )}
                            </Fragment>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </TableBody>
                  </Table>
                </TableWrapper>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Quick View Panel */}
      <WorkOrderQuickPanel
        isOpen={!!quickViewEntry}
        onClose={() => setQuickViewEntry(null)}
        entry={quickViewEntry}
        canEdit={canEdit}
        onSave={handleFieldEdit}
        saving={saving}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <LiquidGlassConfirmModal
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={() => handleDelete(deleteConfirmId)}
          title="確認移除"
          message={`確定要將「${entries.find(e => e.id === deleteConfirmId)?.workOrder.customerName || '此工作單'}」從排單表移除嗎？`}
          confirmText="確認移除"
          cancelText="取消"
          variant="danger"
        />
      )}

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {entries.map((entry) => (
          <Card key={entry.id} className="liquid-glass-card liquid-glass-card-elevated">
            <div className="liquid-glass-content p-4 space-y-3">
              <div className="flex items-center justify-between">
                {canEdit ? (
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      次序: {entry.priority}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    次序: {entry.priority}
                  </span>
                )}
                <Badge 
                  variant={
                    entry.workOrder.workType === 'PRODUCTION' ? 'success' :
                    entry.workOrder.workType === 'PRODUCTION_PACKAGING' ? 'info' :
                    'outline'
                  }
                >
                  {WORK_TYPE_LABELS[entry.workOrder.workType]}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-neutral-500 dark:text-neutral-500">客戶:</span>{' '}
                  <div className="inline-flex items-center gap-1">
                    <SchedulingInlineEdit
                      entryId={entry.id}
                      field="customerName"
                      value={entry.workOrder.customerName}
                      type="text"
                      canEdit={canEditSyncFields}
                      onSave={handleFieldEdit}
                      isLoading={saving.has(entry.id)}
                    />
                    <Link
                      href={`/work-orders/${entry.workOrder.id}`}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      title="查看工作單"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
                
                <div>
                  <span className="text-neutral-500 dark:text-neutral-500">負責人:</span>{' '}
                  {entry.workOrder.personInCharge?.nickname || 
                   entry.workOrder.personInCharge?.phoneE164 || 
                   '未指派'}
                </div>
                
                <div>
                  <span className="text-neutral-500 dark:text-neutral-500">工作類型:</span>{' '}
                  <Badge 
                    variant={
                      entry.workOrder.workType === 'PRODUCTION' ? 'success' :
                      entry.workOrder.workType === 'PRODUCTION_PACKAGING' ? 'info' :
                      'outline'
                    }
                  >
                    {WORK_TYPE_LABELS[entry.workOrder.workType]}
                  </Badge>
                </div>
                
                <div>
                  <span className="text-neutral-500 dark:text-neutral-500">預計生產物料到齊日期:</span>{' '}
                  {entry.workOrder.expectedProductionMaterialsDate
                    ? formatDateOnly(entry.workOrder.expectedProductionMaterialsDate)
                    : <span className="text-neutral-400 dark:text-neutral-500">未設定</span>}
                </div>
                
                <div>
                  <span className="text-neutral-500 dark:text-neutral-500">生產物料已齊:</span>{' '}
                  {canEditSyncFields ? (
                    <SchedulingInlineEdit
                      entryId={entry.id}
                      field="productionMaterialsReady"
                      value={entry.workOrder.productionMaterialsReady}
                      type="checkbox"
                      canEdit={canEditSyncFields}
                      onSave={handleFieldEdit}
                      isLoading={saving.has(entry.id)}
                    />
                  ) : (
                    <Badge 
                      variant={entry.workOrder.productionMaterialsReady ? 'success' : 'warning'}
                    >
                      {entry.workOrder.productionMaterialsReady ? '已齊' : '未齊'}
                    </Badge>
                  )}
                </div>
                
                <div>
                  <span className="text-neutral-500 dark:text-neutral-500">預計開產日期:</span>{' '}
                  <SchedulingInlineEdit
                    entryId={entry.id}
                    field="expectedProductionStartDate"
                    value={entry.expectedProductionStartDate || ''}
                    type="text"
                    canEdit={canEditPriority}
                    onSave={handleFieldEdit}
                    isLoading={saving.has(entry.id)}
                  />
                </div>
                
                {entry.workOrder.capsulationOrder && (
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-500">膠囊訂單:</span>{' '}
                    <Link
                      href={`/work-orders/${entry.workOrder.id}#capsulation`}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center gap-1"
                    >
                      <span>查看</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                )}
                {entry.workOrder.productionOrder && !entry.workOrder.capsulationOrder && (
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-500">生產訂單:</span>{' '}
                    <Link
                      href={`/orders/${entry.workOrder.productionOrder.id}`}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center gap-1"
                    >
                      <span>查看</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Mobile Actions */}
              {canEdit && (
                <div className="flex justify-end pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirmId(entry.id)}
                    disabled={deleting === entry.id}
                    className="text-danger-600 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-900/20"
                  >
                    {deleting === entry.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        刪除中...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        移除
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
