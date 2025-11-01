/**
 * Work Order Table Component - Redesigned for Maximum Information Density
 * 
 * Displays work orders with dense multi-line cells showing:
 * - Customer / Job / Status / Description / VIP / Urgent
 * - Person in Charge
 * - Work Type + Production Started indicator
 * - Quantity (Production + Packaging)
 * - Material Status (Production + Packaging)
 * - Created Date
 * - Quick Actions dropdown menu
 */

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { WorkOrder, User } from '@/types/work-order'
import { WorkOrderStatus, WorkType } from '@prisma/client'
import { Badge } from '@/components/ui/badge'
import { Text } from '@/components/ui/text'
import { TableWrapper } from '@/components/ui/table-wrapper'
import { OrderLinkBadge } from '@/components/ui/order-link-badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Factory,
  User as UserIcon,
  Calendar,
  ExternalLink,
  Timer,
  Square,
  Link2,
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { WORK_TYPE_LABELS, WORK_ORDER_STATUS_LABELS } from '@/types/work-order'
import { QuickActionsMenu } from './quick-actions-menu'
import { useToast } from '@/components/ui/toast-provider'
import { EditableNotesCell } from './editable-notes-cell'
import { WorkOrderQuickPanel } from './work-order-quick-panel'
import { WorkOrderInlineEdit } from './work-order-inline-edit'
import { useSchedulingStatus } from '@/hooks/use-scheduling-status'
import { useAuth } from '@/components/auth/auth-provider'

interface WorkOrderTableProps {
  workOrders: WorkOrder[]
  users: User[]
  isLoading: boolean
  isFetching: boolean
  onSort: (field: string) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onDelete: (id: string) => void
  onRefresh?: () => Promise<void>
}

/**
 * Skeleton row for loading state
 */
function SkeletonRow() {
  return (
    <tr>
      <td className="px-3 py-3"><Skeleton className="h-4 w-4" /></td>
      <td className="px-3 py-3"><Skeleton className="h-20 w-full" /></td>
      <td className="px-3 py-3"><Skeleton className="h-12 w-24" /></td>
      <td className="px-3 py-3"><Skeleton className="h-12 w-20" /></td>
      <td className="px-3 py-3"><Skeleton className="h-12 w-20" /></td>
      <td className="px-3 py-3"><Skeleton className="h-12 w-24" /></td>
      <td className="px-3 py-3"><Skeleton className="h-12 w-20" /></td>
      <td className="px-3 py-3"><Skeleton className="h-8 w-8" /></td>
    </tr>
  )
}

/**
 * Check if production has really started (mirrors /orders page logic)
 * Production has started if:
 * - Capsulation order has worklogs AND is not completed
 * - OR work order productionStarted flag is true AND is not completed
 */
function hasProductionStarted(workOrder: WorkOrder): boolean {
  // Check if work order is completed - production cannot be "started" if already completed
  const isCompleted = workOrder.isCompleted || workOrder.status === 'COMPLETED'
  if (isCompleted) {
    return false
  }

  // 1) If capsulationOrder exists, check if it has worklogs (mirrors /orders page logic)
  if (workOrder.capsulationOrder) {
    const order = workOrder.capsulationOrder
    const hasWorklog = Array.isArray(order.worklogs) && order.worklogs.length > 0
    const orderCompleted = Boolean(order.completionDate)
    return hasWorklog && !orderCompleted
  }

  // 2) Check productionStarted flag directly (this is the most reliable indicator)
  // If productionStarted is true, production has started
  if (workOrder.productionStarted) {
    return true
  }

  // 3) If there are linked productionOrders but productionStarted flag is false,
  // we still don't consider production started (flag is authoritative)
  return false
}

/**
 * Check if production materials are applicable for this work type
 * Production materials only needed for PRODUCTION and PRODUCTION_PACKAGING
 */
function hasProductionMaterials(workType: WorkType): boolean {
  return workType === WorkType.PRODUCTION || workType === WorkType.PRODUCTION_PACKAGING
}

/**
 * Check if packaging materials are applicable for this work type
 * Packaging materials only needed for PACKAGING and PRODUCTION_PACKAGING
 */
function hasPackagingMaterials(workType: WorkType): boolean {
  return workType === WorkType.PACKAGING || workType === WorkType.PRODUCTION_PACKAGING
}

/**
 * Capsule production order status badge component
 * Displays:
 * 1. Status badge (PAUSED, COMPLETED, CANCELLED) if status is set
 * 2. "生產中" if production has started and status is null
 * 3. Nothing if status is null and production hasn't started
 */
function CapsuleOrderStatusBadge({ workOrder }: { workOrder: WorkOrder }) {
  // First check if there's a set status (PAUSED, COMPLETED, CANCELLED)
  if (workOrder.status) {
    const statusVariants: Record<WorkOrderStatus, 'warning' | 'success' | 'danger'> = {
      PAUSED: 'warning',
      COMPLETED: 'success',
      CANCELLED: 'danger'
    }
    
    return (
      <Badge 
        variant={statusVariants[workOrder.status]} 
        className="inline-flex items-center gap-1 text-xs"
      >
        {WORK_ORDER_STATUS_LABELS[workOrder.status]}
      </Badge>
    )
  }
  
  // If no status is set, check if production has started
  const productionStarted = hasProductionStarted(workOrder)
  
  if (productionStarted) {
    return (
      <Badge variant="outline" className="inline-flex items-center gap-1 text-xs text-warning-700 dark:text-warning-400">
        <Factory className="h-3.5 w-3.5" aria-hidden="true" />
        生產中
      </Badge>
    )
  }
  
  // Show nothing for ongoing work without production started
  return null
}


/**
 * Delivery date cell component - neutral display
 */
function DeliveryDateCell({ requestedDeliveryDate }: { requestedDeliveryDate: Date | null | undefined }) {
  if (!requestedDeliveryDate) {
    return <span className="text-xs text-neutral-400 dark:text-white/45">未設定</span>
  }

  const deliveryDate = new Date(requestedDeliveryDate)
  const formattedDate = deliveryDate.toLocaleDateString('zh-HK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })

  return (
    <span className="text-xs text-neutral-700 dark:text-white/85">
      {formattedDate}
    </span>
  )
}

/**
 * Sortable column header
 */
function SortableHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort
}: {
  label: string
  field: string
  currentSort?: string
  currentOrder?: 'asc' | 'desc'
  onSort: (field: string) => void
}) {
  const isSorted = currentSort === field
  const Icon = isSorted ? (currentOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown

  return (
    <button
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
    >
      {label}
      <Icon className="h-3.5 w-3.5" />
    </button>
  )
}

export function WorkOrderTable({
  workOrders,
  users,
  isLoading,
  isFetching,
  onSort,
  sortBy,
  sortOrder,
  onDelete,
  onRefresh
}: WorkOrderTableProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const { isManager, isAdmin } = useAuth()
  
  // Quick panel state
  const [quickPanelWorkOrder, setQuickPanelWorkOrder] = useState<WorkOrder | null>(null)
  const [isQuickPanelOpen, setIsQuickPanelOpen] = useState(false)
  const [saving, setSaving] = useState<Set<string>>(new Set())
  
  // Expandable state for mobile cards
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  
  // Batch fetch scheduling status for all PRODUCTION work orders
  // Only fetch if user is Manager or Admin
  const productionWorkOrderIds = useMemo(() => {
    if (!isManager && !isAdmin) return []
    return workOrders
      .filter(wo => wo.workType === WorkType.PRODUCTION || wo.workType === WorkType.PRODUCTION_PACKAGING)
      .map(wo => wo.id)
  }, [workOrders, isManager, isAdmin])
  
  const { status: schedulingStatus } = useSchedulingStatus(productionWorkOrderIds, {
    enabled: productionWorkOrderIds.length > 0
  })
  
  const toggleExpand = useCallback((workOrderId: string, event?: React.MouseEvent<HTMLButtonElement>) => {
    // Store scroll position BEFORE state update (like Select fix)
    const savedScroll = window.scrollY
    
    // Update state
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(workOrderId)) {
        next.delete(workOrderId)
      } else {
        next.add(workOrderId)
      }
      return next
    })
    
    // Restore scroll position after DOM update (like Select fix)
    // Use requestAnimationFrame to ensure it happens after browser's focus scroll
    requestAnimationFrame(() => {
      window.scrollTo({
        top: savedScroll,
        left: 0,
        behavior: 'instant' as ScrollBehavior
      })
      
      // Double-check after a short delay (in case browser scroll happens later)
      setTimeout(() => {
        if (window.scrollY !== savedScroll) {
          window.scrollTo({
            top: savedScroll,
            left: 0,
            behavior: 'instant' as ScrollBehavior
          })
        }
      }, 10)
    })
    
    // Prevent button from maintaining focus (which can cause scroll)
    if (event?.currentTarget) {
      event.currentTarget.blur()
    }
  }, [])

  const allExpanded = useMemo(() => {
    return workOrders.length > 0 && expandedRows.size === workOrders.length
  }, [workOrders.length, expandedRows.size])

  const expandAll = useCallback(() => {
    setExpandedRows(new Set(workOrders.map(wo => wo.id)))
  }, [workOrders])

  const collapseAll = useCallback(() => {
    setExpandedRows(new Set())
  }, [])
  
  // Open quick panel from row click
  const handleRowClick = (workOrder: WorkOrder) => {
    setQuickPanelWorkOrder(workOrder)
    setIsQuickPanelOpen(true)
  }
  
  // Handle field save from quick panel
  const handleFieldSave = async (
    workOrderId: string,
    field: string,
    value: string | number | boolean | null
  ) => {
    setSaving(prev => new Set(prev).add(workOrderId))
    
    try {
      // Convert 'UNASSIGNED' to null for database fields
      const processedValue = value === 'UNASSIGNED' ? null : value
      
      console.log('[Field Save]', { field, value, processedValue, workOrderId })
      
      const response = await fetch(`/api/work-orders/${workOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: processedValue })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('[Field Save Error]', { field, processedValue, error })
        throw new Error(error.error || '更新失敗')
      }

      await onRefresh?.()
    } catch (error) {
      console.error('[Field Save Exception]', error)
      showToast({
        title: '更新失敗',
        description: error instanceof Error ? error.message : '未知錯誤',
        variant: 'destructive'
      })
    } finally {
      setSaving(prev => {
        const next = new Set(prev)
        next.delete(workOrderId)
        return next
      })
    }
  }

  const handleToggleProductionStarted = async (workOrderId: string, value: boolean) => {
    try {
      const response = await fetch(`/api/work-orders/${workOrderId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'productionStarted', value })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Toggle failed')
      }

      showToast({ title: value ? '已標記為已開工' : '已標記為未開工' })
      await onRefresh?.()
    } catch (error) {
      showToast({ 
        title: '更新失敗',
        description: error instanceof Error ? error.message : '未知錯誤',
        variant: 'destructive' 
      })
      throw error
    }
  }

  const handleToggleMaterialReady = async (workOrderId: string, field: 'production' | 'packaging', value: boolean) => {
    try {
      const apiField = field === 'production' ? 'productionMaterialsReady' : 'packagingMaterialsReady'
      const response = await fetch(`/api/work-orders/${workOrderId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: apiField, value })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Toggle failed')
      }

      const label = field === 'production' ? '生產物料' : '包裝物料'
      showToast({ title: `${label}已標記為${value ? '齊全' : '未齊'}` })
      await onRefresh?.()
    } catch (error) {
      showToast({ 
        title: '更新失敗',
        description: error instanceof Error ? error.message : '未知錯誤',
        variant: 'destructive' 
      })
      throw error
    }
  }

  const handleStatusChange = async (workOrderId: string, newStatus: WorkOrderStatus | null) => {
    try {
      const response = await fetch(`/api/work-orders/${workOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Status update failed')
      }

      showToast({ title: '狀態已更新' })
      await onRefresh?.()
    } catch (error) {
      showToast({ 
        title: '更新失敗',
        description: error instanceof Error ? error.message : '未知錯誤',
        variant: 'destructive' 
      })
      throw error
    }
  }

  return (
    <div className="relative">
      {/* Loading overlay for refetch */}
      {isFetching && !isLoading && (
        <div className="absolute inset-0 bg-surface-primary/50 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="bg-surface-primary rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent" />
              <Text.Secondary className="text-sm">更新中...</Text.Secondary>
            </div>
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto">
        <TableWrapper>
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-surface-primary/80 dark:bg-elevation-0/80">
              <tr>
                <th className="text-left py-3 px-3 font-medium text-neutral-900 dark:text-white/95 text-sm">
                  <SortableHeader
                    label="客戶 / 工作"
                    field="customerName"
                    currentSort={sortBy}
                    currentOrder={sortOrder}
                    onSort={onSort}
                  />
                </th>
                <th className="text-left py-3 px-3 font-medium text-neutral-900 dark:text-white/95 text-sm">
                  <SortableHeader
                    label="要求交貨期"
                    field="requestedDeliveryDate"
                    currentSort={sortBy}
                    currentOrder={sortOrder}
                    onSort={onSort}
                  />
                </th>
                <th className="text-left py-3 px-3 font-medium text-neutral-900 dark:text-white/95 text-sm">
                  <SortableHeader
                    label="負責人"
                    field="personInCharge"
                    currentSort={sortBy}
                    currentOrder={sortOrder}
                    onSort={onSort}
                  />
                </th>
                <th className="text-left py-3 px-3 font-medium text-neutral-900 dark:text-white/95 text-sm">
                  <SortableHeader
                    label="狀態"
                    field="status"
                    currentSort={sortBy}
                    currentOrder={sortOrder}
                    onSort={onSort}
                  />
                </th>
                <th className="text-left py-3 px-3 font-medium text-neutral-900 dark:text-white/95 text-sm">
                  備註
                </th>
                <th className="text-left py-3 px-3 font-medium text-neutral-900 dark:text-white/95 text-sm hidden xl:table-cell">
                  關聯膠囊訂單
                </th>
                <th className="text-left py-3 px-3 font-medium text-neutral-900 dark:text-white/95 text-sm">
                  數量
                </th>
                <th className="text-left py-3 px-3 font-medium text-neutral-900 dark:text-white/95 text-sm">
                  物料狀態
                </th>
                <th className="text-left py-3 px-3 font-medium text-neutral-900 dark:text-white/95 text-sm">
                  <SortableHeader
                    label="創建日期"
                    field="markedDate"
                    currentSort={sortBy}
                    currentOrder={sortOrder}
                    onSort={onSort}
                  />
                </th>
                <th className="text-left py-3 px-3 font-medium text-neutral-900 dark:text-white/95 text-sm w-12">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {(isLoading || isFetching) ? (
                <>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <SkeletonRow key={`skeleton-${index}`} />
                  ))}
                </>
              ) : workOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-neutral-500 dark:text-white/65">
                    沒有找到工作單
                  </td>
                </tr>
              ) : (
                workOrders.map((workOrder) => (
                    <tr
                      key={workOrder.id}
                      className={`border-b border-neutral-200 dark:border-neutral-700 hover:bg-surface-secondary/30 dark:hover:bg-elevation-2 transition-colors cursor-pointer`}
                      onClick={() => handleRowClick(workOrder)}
                    >
                    {/* Customer / Job / Status / Description / VIP / Urgent */}
                    <td className="py-3 px-3 text-sm align-top max-w-md" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-1">
                        {/* Customer name - Inline editable */}
                        <div className="flex items-center gap-2">
                          <WorkOrderInlineEdit
                            workOrderId={workOrder.id}
                            field="customerName"
                            value={workOrder.customerName}
                            type="text"
                            canEdit={true}
                            onSave={async (value) => {
                              await handleFieldSave(workOrder.id, 'customerName', value)
                            }}
                            isLoading={saving.has(workOrder.id)}
                            className="flex-1 font-semibold text-base"
                          />
                        </div>
                        
                        {/* Job number - Inline editable */}
                        <div className="flex items-center gap-2">
                          <WorkOrderInlineEdit
                            workOrderId={workOrder.id}
                            field="jobNumber"
                            value={workOrder.jobNumber || ''}
                            type="text"
                            canEdit={true}
                            onSave={async (value) => {
                              await handleFieldSave(workOrder.id, 'jobNumber', value)
                            }}
                            isLoading={saving.has(workOrder.id)}
                            className="text-xs"
                          />
                        </div>
                        
                        {/* Work description - Inline editable */}
                        <div>
                          <WorkOrderInlineEdit
                            workOrderId={workOrder.id}
                            field="workDescription"
                            value={workOrder.workDescription || ''}
                            type="textarea"
                            canEdit={true}
                            onSave={async (value) => {
                              await handleFieldSave(workOrder.id, 'workDescription', value)
                            }}
                            isLoading={saving.has(workOrder.id)}
                            className="text-xs"
                          />
                        </div>
                        
                        {/* VIP and urgent markers */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {workOrder.isCustomerServiceVip && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400">
                              <Star className="h-2.5 w-2.5 fill-current" />
                              客服VIP
                            </span>
                          )}
                          {workOrder.isBossVip && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400">
                              <Star className="h-2.5 w-2.5 fill-current" />
                              老闆VIP
                            </span>
                          )}
                          {workOrder.isUrgent && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400">
                              ⚡ 加急
                            </span>
                          )}
                          {workOrder.isCompleted && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400">
                              ✓ 已經完成
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Requested Delivery Date */}
                    <td className="py-3 px-3 text-sm align-top">
                      <DeliveryDateCell requestedDeliveryDate={workOrder.requestedDeliveryDate} />
                    </td>

                    {/* Person in Charge */}
                    <td className="py-3 px-3 text-sm align-top" onClick={(e) => e.stopPropagation()}>
                      <WorkOrderInlineEdit
                        workOrderId={workOrder.id}
                        field="personInChargeId"
                        value={workOrder.personInChargeId || 'UNASSIGNED'}
                        type="select"
                        canEdit={true}
                        options={[
                          { value: 'UNASSIGNED', label: '未指定' },
                          ...users.map(user => ({ 
                            value: user.id, 
                            label: user.nickname || user.phoneE164 
                          }))
                        ]}
                        onSave={async (value) => {
                          await handleFieldSave(workOrder.id, 'personInChargeId', value)
                        }}
                        isLoading={saving.has(workOrder.id)}
                      />
                    </td>

                    {/* Capsule Order Status */}
                    <td className="py-3 px-3 text-sm align-top">
                      <CapsuleOrderStatusBadge workOrder={workOrder} />
                    </td>

                    {/* Notes - Multi-line text field */}
                    <td 
                      className="py-3 px-3 text-sm align-top max-w-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <EditableNotesCell
                        workOrderId={workOrder.id}
                        currentNotes={workOrder.notes}
                        onRefresh={onRefresh}
                      />
                    </td>

                    {/* Linked Encapsulation Orders */}
                    <td className="py-3 px-3 text-sm align-top hidden xl:table-cell">
                      {workOrder.productionOrders && workOrder.productionOrders.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {workOrder.productionOrders.slice(0, 2).map(order => {
                            // Calculate order status
                            const hasWorklogs = order.worklogs && order.worklogs.length > 0
                            const isCompleted = hasWorklogs && order.completionDate
                            const isInProgress = hasWorklogs && !order.completionDate
                            const isNotStarted = !hasWorklogs
                            
                            const statusBadge = isCompleted ? (
                              <Badge variant="outline" className="text-xs text-success-700 dark:text-success-400 inline-flex items-center gap-0.5">
                                <CheckCircle className="h-3 w-3" />
                                已完成
                              </Badge>
                            ) : isInProgress ? (
                              <Badge variant="outline" className="text-xs text-info-700 dark:text-info-400 inline-flex items-center gap-0.5">
                                <Timer className="h-3 w-3" />
                                進行中
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-neutral-600 dark:text-neutral-400 inline-flex items-center gap-0.5">
                                <Square className="h-3 w-3" />
                                未開始
                              </Badge>
                            )
                            
                            return (
                              <div key={order.id}>
                                <OrderLinkBadge
                                  type="encapsulation-order"
                                  orderId={order.id}
                                  label={order.productName}
                                  size="sm"
                                />
                                <div className="mt-0.5">
                                  {statusBadge}
                                </div>
                              </div>
                            )
                          })}
                          {workOrder.productionOrders.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{workOrder.productionOrders.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <Text.Secondary className="text-xs">-</Text.Secondary>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-3 text-sm align-top">
                      <div className="flex flex-col gap-0.5">
                        {workOrder.productionQuantity ? (
                          <div className="text-neutral-900 dark:text-white/95">
                            生產: {workOrder.productionQuantity}{workOrder.productionQuantityStat || '個'}
                          </div>
                        ) : null}
                        {workOrder.packagingQuantity ? (
                          <div className="text-neutral-700 dark:text-white/85 text-xs">
                            包裝: {workOrder.packagingQuantity}{workOrder.packagingQuantityStat || '個'}
                          </div>
                        ) : null}
                        {!workOrder.productionQuantity && !workOrder.packagingQuantity && (
                          <span className="text-neutral-500 dark:text-white/65 text-xs">-</span>
                        )}
                      </div>
                    </td>

                    {/* Material Status */}
                    <td className="py-3 px-3 text-sm align-top">
                      <div className="flex flex-col gap-1">
                        {/* Production materials */}
                        {hasProductionMaterials(workOrder.workType) ? (
                          <div className="flex items-center gap-1.5">
                            {workOrder.productionMaterialsReady ? (
                              <>
                                <CheckCircle className="h-3.5 w-3.5 text-success-600 dark:text-success-400" />
                                <span className="text-xs text-success-700 dark:text-success-400">生產物料齊</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3.5 w-3.5 text-neutral-400 dark:text-white/55" />
                                <span className="text-xs text-neutral-500 dark:text-white/65">生產物料未齊</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-600">-</span>
                            <span className="text-xs text-neutral-400 dark:text-neutral-600">不適用</span>
                          </div>
                        )}
                        
                        {/* Packaging materials */}
                        {hasPackagingMaterials(workOrder.workType) ? (
                          <div className="flex items-center gap-1.5">
                            {workOrder.packagingMaterialsReady ? (
                              <>
                                <CheckCircle className="h-3.5 w-3.5 text-success-600 dark:text-success-400" />
                                <span className="text-xs text-success-700 dark:text-success-400">包裝物料齊</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3.5 w-3.5 text-neutral-400 dark:text-white/55" />
                                <span className="text-xs text-neutral-500 dark:text-white/65">包裝物料未齊</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-600">-</span>
                            <span className="text-xs text-neutral-400 dark:text-neutral-600">不適用</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Created Date */}
                    <td className="py-3 px-3 text-sm text-neutral-700 dark:text-white/85 align-top">
                      {workOrder.markedDate
                        ? new Date(workOrder.markedDate).toLocaleDateString('zh-HK', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })
                        : '-'}
                    </td>

                    {/* Actions dropdown */}
                    <td className="py-3 px-3 align-top" onClick={(e) => e.stopPropagation()}>
                      <QuickActionsMenu
                        workOrder={workOrder}
                        onDelete={onDelete}
                        onStatusChange={handleStatusChange}
                        onToggleMaterialReady={handleToggleMaterialReady}
                        onToggleProductionStarted={handleToggleProductionStarted}
                        onRefresh={onRefresh}
                        schedulingStatus={schedulingStatus?.[workOrder.id]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableWrapper>
      </div>

      {/* Mobile Action Bar */}
      {workOrders.length > 0 && (
        <div className="lg:hidden mb-4 flex justify-end gap-3">
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
        </div>
      )}

      {/* Mobile/Tablet view - Expandable Cards */}
      <div className="lg:hidden">
        <div className="space-y-4">
          {(isLoading || isFetching) ? (
            <>
              {[...Array(5)].map((_, i) => (
                <Card key={`skeleton-${i}`} className="liquid-glass-card liquid-glass-card-elevated">
                  <CardContent className="liquid-glass-content p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/3 mb-3" />
                    <Skeleton className="h-5 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : workOrders.length === 0 ? (
            <div className="lg:hidden py-12 px-4 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
                <div className="text-neutral-400 dark:text-white/55">📋</div>
              </div>
              <Text.Primary className="text-lg font-medium mb-2">
                沒有找到工作單
              </Text.Primary>
              <Text.Secondary className="text-sm">
                嘗試調整篩選條件或新增工作單
              </Text.Secondary>
            </div>
          ) : (
            workOrders.map((workOrder) => {
              const isExpanded = expandedRows.has(workOrder.id)
              
              return (
                <Card
                  key={workOrder.id}
                  className="liquid-glass-card liquid-glass-card-elevated transition-apple"
                >
                  <CardContent className="liquid-glass-content p-4 space-y-3">
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* Expand Toggle */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleExpand(workOrder.id, e)
                          }}
                          className="h-11 w-11 p-0 flex-shrink-0"
                          aria-label={isExpanded ? "收起詳情" : "展開詳情"}
                          tabIndex={0}
                        >
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </Button>
                        
                        {/* Status Badge */}
                        <div className="flex-shrink-0">
                          <CapsuleOrderStatusBadge workOrder={workOrder} />
                        </div>
                      </div>
                      
                      {/* Quick Actions */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <QuickActionsMenu
                          workOrder={workOrder}
                          onDelete={onDelete}
                          onStatusChange={handleStatusChange}
                          onToggleMaterialReady={handleToggleMaterialReady}
                          onToggleProductionStarted={handleToggleProductionStarted}
                          onRefresh={onRefresh}
                          schedulingStatus={schedulingStatus?.[workOrder.id]}
                        />
                      </div>
                    </div>
                    
                    {/* Customer Name - Inline Editable */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <WorkOrderInlineEdit
                        workOrderId={workOrder.id}
                        field="customerName"
                        value={workOrder.customerName}
                        type="text"
                        canEdit={true}
                        onSave={async (value) => {
                          await handleFieldSave(workOrder.id, 'customerName', value)
                        }}
                        isLoading={saving.has(workOrder.id)}
                        className="text-base font-semibold"
                      />
                    </div>
                    
                    {/* Job Number - Inline Editable */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <WorkOrderInlineEdit
                        workOrderId={workOrder.id}
                        field="jobNumber"
                        value={workOrder.jobNumber || ''}
                        type="text"
                        canEdit={true}
                        onSave={async (value) => {
                          await handleFieldSave(workOrder.id, 'jobNumber', value)
                        }}
                        isLoading={saving.has(workOrder.id)}
                        className="text-xs text-neutral-500 dark:text-white/65"
                      />
                    </div>

                    {/* Basic Info - Always Visible */}
                    <div className="space-y-2.5 text-sm">
                      {/* Delivery Date */}
                      {workOrder.requestedDeliveryDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500 dark:text-neutral-500 flex-shrink-0">要求交貨期</span>
                          <span className="font-medium text-neutral-900 dark:text-white text-right">
                            {new Date(workOrder.requestedDeliveryDate).toLocaleDateString('zh-HK', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                      
                      {/* Person in Charge - Inline Editable */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-neutral-500 dark:text-neutral-500 flex-shrink-0">負責人</span>
                        <div className="text-right min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
                          <WorkOrderInlineEdit
                            workOrderId={workOrder.id}
                            field="personInChargeId"
                            value={workOrder.personInChargeId || 'UNASSIGNED'}
                            type="select"
                            canEdit={true}
                            options={[
                              { value: 'UNASSIGNED', label: '未指定' },
                              ...users.map(user => ({ 
                                value: user.id, 
                                label: user.nickname || user.phoneE164 
                              }))
                            ]}
                            onSave={async (value) => {
                              await handleFieldSave(workOrder.id, 'personInChargeId', value)
                            }}
                            isLoading={saving.has(workOrder.id)}
                          />
                        </div>
                      </div>
                      
                      {/* Work Type Badge */}
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500 dark:text-neutral-500">工作類型</span>
                        <Badge variant="info" className="text-xs">
                          {WORK_TYPE_LABELS[workOrder.workType]}
                        </Badge>
                      </div>
                      
                      {/* Production Started Indicator */}
                      {hasProductionStarted(workOrder) && (
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500 dark:text-neutral-500">狀態</span>
                          <div className="flex items-center gap-1 text-xs text-warning-700 dark:text-warning-400">
                            <Factory className="h-3 w-3" />
                            <span>生產中</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Production Materials Status */}
                      {hasProductionMaterials(workOrder.workType) ? (
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500 dark:text-neutral-500">生產物料</span>
                          <div className="flex items-center gap-1 text-xs">
                            {workOrder.productionMaterialsReady ? (
                              <>
                                <CheckCircle className="h-3 w-3 text-success-600 dark:text-success-400" />
                                <span className="text-success-700 dark:text-success-400">已齊</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 text-neutral-400 dark:text-white/55" />
                                <span className="text-neutral-500 dark:text-white/65">未齊</span>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500 dark:text-neutral-500">生產物料</span>
                          <span className="text-xs text-neutral-400 dark:text-neutral-600">不適用</span>
                        </div>
                      )}
                      
                      {/* Packaging Materials Status */}
                      {hasPackagingMaterials(workOrder.workType) ? (
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500 dark:text-neutral-500">包裝物料</span>
                          <div className="flex items-center gap-1 text-xs">
                            {workOrder.packagingMaterialsReady ? (
                              <>
                                <CheckCircle className="h-3 w-3 text-success-600 dark:text-success-400" />
                                <span className="text-success-700 dark:text-success-400">已齊</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 text-neutral-400 dark:text-white/55" />
                                <span className="text-neutral-500 dark:text-white/65">未齊</span>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500 dark:text-neutral-500">包裝物料</span>
                          <span className="text-xs text-neutral-400 dark:text-neutral-600">不適用</span>
                        </div>
                      )}
                    </div>

                    {/* Badges Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {workOrder.isCustomerServiceVip && <Badge variant="warning" className="text-xs">客服VIP</Badge>}
                      {workOrder.isBossVip && <Badge variant="danger" className="text-xs">老闆VIP</Badge>}
                      {workOrder.isUrgent && <Badge variant="danger" className="text-xs">⚡ 加急</Badge>}
                      {workOrder.isCompleted && <Badge variant="success" className="text-xs">✓ 已完成</Badge>}
                    </div>

                    {/* Expanded State Content */}
                    {isExpanded && (
                      <>
                        <div className="border-t border-neutral-200 dark:border-neutral-700 my-3" />
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-neutral-500 dark:text-neutral-400 block text-xs mb-1">創建日期</span>
                            <div className="font-medium text-neutral-900 dark:text-white">
                              {workOrder.markedDate
                                ? new Date(workOrder.markedDate).toLocaleDateString('zh-HK', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit'
                                  })
                                : '-'}
                            </div>
                          </div>
                          <div>
                            <span className="text-neutral-500 dark:text-neutral-400 block text-xs mb-1">生產數量</span>
                            <div className="font-medium text-neutral-900 dark:text-white">
                              {workOrder.productionQuantity || 0}
                              {workOrder.productionQuantityStat || '個'}
                            </div>
                          </div>
                          <div>
                            <span className="text-neutral-500 dark:text-neutral-400 block text-xs mb-1">包裝數量</span>
                            <div className="font-medium text-neutral-900 dark:text-white">
                              {workOrder.packagingQuantity || 0}
                              {workOrder.packagingQuantityStat || '個'}
                            </div>
                          </div>
                        </div>

                        {/* Work Description - Editable (Always Show) */}
                        <div>
                          <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                            工作描述
                          </h4>
                          <div onClick={(e) => e.stopPropagation()}>
                            <WorkOrderInlineEdit
                              workOrderId={workOrder.id}
                              field="workDescription"
                              value={workOrder.workDescription || ''}
                              type="textarea"
                              canEdit={true}
                              onSave={async (value) => {
                                await handleFieldSave(workOrder.id, 'workDescription', value)
                              }}
                              isLoading={saving.has(workOrder.id)}
                            />
                          </div>
                        </div>

                        {/* Notes - Editable */}
                        <div>
                          <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                            備註
                          </h4>
                          <div onClick={(e) => e.stopPropagation()}>
                            <EditableNotesCell
                              workOrderId={workOrder.id}
                              currentNotes={workOrder.notes}
                              onRefresh={onRefresh}
                            />
                          </div>
                        </div>

                        {/* Linked Orders */}
                        {workOrder.productionOrders && workOrder.productionOrders.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                              關聯膠囊訂單
                            </h4>
                            <div className="flex flex-col gap-2">
                              {workOrder.productionOrders.slice(0, 3).map(order => {
                                const hasWorklogs = order.worklogs && order.worklogs.length > 0
                                const isCompleted = hasWorklogs && order.completionDate
                                const isInProgress = hasWorklogs && !order.completionDate
                                
                                const statusBadge = isCompleted ? (
                                  <Badge variant="outline" className="text-xs text-success-700 dark:text-success-400 inline-flex items-center gap-0.5">
                                    <CheckCircle className="h-3 w-3" />
                                    已完成
                                  </Badge>
                                ) : isInProgress ? (
                                  <Badge variant="outline" className="text-xs text-info-700 dark:text-info-400 inline-flex items-center gap-0.5">
                                    <Timer className="h-3 w-3" />
                                    進行中
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-neutral-600 dark:text-neutral-400 inline-flex items-center gap-0.5">
                                    <Square className="h-3 w-3" />
                                    未開始
                                  </Badge>
                                )
                                
                                return (
                                  <div key={order.id} className="flex items-center gap-2">
                                    <OrderLinkBadge
                                      type="encapsulation-order"
                                      orderId={order.id}
                                      label={order.productName}
                                      size="sm"
                                    />
                                    {statusBadge}
                                  </div>
                                )
                              })}
                              {workOrder.productionOrders.length > 3 && (
                                <Badge variant="secondary" className="text-xs w-fit">
                                  +{workOrder.productionOrders.length - 3} 更多訂單
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* Quick Panel */}
      <WorkOrderQuickPanel
        isOpen={isQuickPanelOpen}
        onClose={() => setIsQuickPanelOpen(false)}
        workOrder={quickPanelWorkOrder}
        users={users}
        canEdit={true}
        onSave={handleFieldSave}
        saving={saving}
      />
    </div>
  )
}
