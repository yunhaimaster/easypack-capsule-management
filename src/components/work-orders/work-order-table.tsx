/**
 * Work Order Table Component
 * 
 * Compact multi-column table matching orders design pattern.
 * Displays work orders with dense information in each cell.
 */

import { useState } from 'react'
import Link from 'next/link'
import { WorkOrder, User } from '@/types/work-order'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { TableWrapper } from '@/components/ui/table-wrapper'
import { Eye, Edit, Trash2, ArrowUpDown, CheckCircle, XCircle, AlertCircle, Star, Edit3, Timer, Calendar, Square, Package2, Bot } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { WORK_TYPE_LABELS, WORK_ORDER_STATUS_LABELS } from '@/types/work-order'
import { EditableStatusCell } from './editable-status-cell'
import { EditableCheckboxCell } from './editable-checkbox-cell'
import { QuickEditModal } from './quick-edit-modal'
import { useToast } from '@/components/ui/toast-provider'

interface WorkOrderTableProps {
  workOrders: WorkOrder[]
  users: User[]  // For quick edit modal
  isLoading: boolean
  isFetching: boolean
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onSort: (field: string) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onDelete: (id: string) => void
  onRefresh?: () => Promise<void>  // Add manual refetch callback
}

/**
 * Skeleton row component for loading state
 */
function SkeletonRow() {
  return (
    <tr>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-4" />
      </td>
      <td className="px-4 py-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
        </div>
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-6 w-16" />
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </td>
    </tr>
  )
}

/**
 * Status badge with color coding and icons (matching orders design)
 */
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    DRAFT: 'default',
    PENDING: 'warning',
    DATA_COMPLETE: 'info',
    NOTIFIED: 'info',
    PAID: 'success',
    SHIPPED: 'success',
    COMPLETED: 'success',
    ON_HOLD: 'warning',
    CANCELLED: 'danger'
  }
  
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    DRAFT: Square,
    PENDING: Timer,
    DATA_COMPLETE: Timer,
    NOTIFIED: Timer,
    PAID: CheckCircle,
    SHIPPED: CheckCircle,
    COMPLETED: Calendar,
    ON_HOLD: AlertCircle,
    CANCELLED: XCircle
  }
  
  const Icon = icons[status] || Square
  
  return (
    <Badge 
      variant={variants[status] || 'default'}
      className="inline-flex items-center gap-1"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {WORK_ORDER_STATUS_LABELS[status as keyof typeof WORK_ORDER_STATUS_LABELS] || status}
    </Badge>
  )
}

/**
 * Work type badge
 */
function WorkTypeBadge({ workType }: { workType: string }) {
  return (
    <Badge variant="default">
      {WORK_TYPE_LABELS[workType as keyof typeof WORK_TYPE_LABELS] || workType}
    </Badge>
  )
}

/**
 * Sortable column header
 */
function SortableHeader({ 
  field, 
  label, 
  currentSort, 
  sortOrder, 
  onSort 
}: { 
  field: string
  label: string
  currentSort?: string
  sortOrder?: 'asc' | 'desc'
  onSort: (field: string) => void
}) {
  const isActive = currentSort === field
  
  return (
    <th 
      className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-white/85 cursor-pointer hover:bg-surface-secondary/50 transition-colors"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        <ArrowUpDown 
          className={`h-4 w-4 ${isActive ? 'text-primary-600' : 'text-neutral-400 dark:text-white/55'}`}
        />
        {isActive && (
          <span className="text-xs text-primary-600">
            {sortOrder === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  )
}

/**
 * Main table component - Compact multi-column design matching orders
 */
export function WorkOrderTable({
  workOrders,
  users,
  isLoading,
  isFetching,
  selectedIds,
  onSelectionChange,
  onSort,
  sortBy,
  sortOrder,
  onDelete,
  onRefresh
}: WorkOrderTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [quickEditWorkOrder, setQuickEditWorkOrder] = useState<WorkOrder | null>(null)
  const { showToast } = useToast()
  
  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(workOrders.map(wo => wo.id))
    } else {
      onSelectionChange([])
    }
  }
  
  // Handle individual selection
  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id])
    } else {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id))
    }
  }
  
  const allSelected = workOrders.length > 0 && selectedIds.length === workOrders.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < workOrders.length
  
  return (
    <div className="relative">
      {/* Loading overlay for refetch (not initial load) */}
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
      <div className="hidden lg:block">
        <TableWrapper>
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-surface-primary/80 dark:bg-elevation-0/80">
              <tr>
                <th className="px-4 py-3 w-8">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="選擇全部"
                  />
                </th>
                <th className="text-left py-3 px-4 font-medium text-neutral-900 dark:text-white/95 text-sm">客戶 / 工作內容</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-900 dark:text-white/95 text-sm">狀態</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-900 dark:text-white/95 text-sm">工作資訊</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-900 dark:text-white/95 text-sm">關聯訂單</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-900 dark:text-white/95 text-sm">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <>
                  {[...Array(10)].map((_, i) => (
                    <SkeletonRow key={`skeleton-${i}`} />
                  ))}
                </>
              ) : workOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-neutral-500 dark:text-white/65">
                    沒有找到工作單
                  </td>
                </tr>
              ) : (
                workOrders.map((workOrder) => (
                  <tr
                    key={workOrder.id}
                    className="border-b border-neutral-200 dark:border-neutral-700 hover:bg-surface-secondary/30 dark:hover:bg-elevation-2 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/work-orders/${workOrder.id}`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-4">
                      <Checkbox
                        checked={selectedIds.includes(workOrder.id)}
                        onCheckedChange={(checked) => handleSelectRow(workOrder.id, checked as boolean)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`選擇 ${workOrder.jobNumber || workOrder.customerName}`}
                      />
                    </td>
                    
                    {/* Customer / Work Description */}
                    <td className="py-4 px-4 text-neutral-900 text-sm align-top">
                      <div className="flex flex-col gap-1">
                        <div className="font-semibold text-neutral-900 dark:text-white/95 text-base">{workOrder.customerName}</div>
                        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-white/75">
                          <span>{workOrder.jobNumber || '-'}</span>
                          <WorkTypeBadge workType={workOrder.workType} />
                        </div>
                        {workOrder.workDescription && (
                          <div className="text-xs text-neutral-500 dark:text-white/65 leading-relaxed">
                            {workOrder.workDescription}
                          </div>
                        )}
                        {/* VIP and urgent markers */}
                        <div className="flex items-center gap-1 text-xs">
                          {workOrder.isCustomerServiceVip && (
                            <Badge variant="warning" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              客服VIP
                            </Badge>
                          )}
                          {workOrder.isBossVip && (
                            <Badge variant="danger" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              老闆VIP
                            </Badge>
                          )}
                          {workOrder.isUrgent && (
                            <Badge variant="danger" className="text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              加急
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    {/* Status */}
                    <td className="py-4 px-4 text-sm align-top">
                      <div className="flex flex-col gap-2">
                        <EditableStatusCell
                          workOrderId={workOrder.id}
                          currentStatus={workOrder.status}
                          onSuccess={() => showToast({ title: '狀態已更新' })}
                          onError={(error) => showToast({ title: '更新失敗', description: error.message, variant: 'destructive' })}
                        />
                        <div className="text-xs text-neutral-500 dark:text-white/65 leading-relaxed">
                          {workOrder.markedDate && (
                            <div>創建日期：{new Date(workOrder.markedDate).toLocaleDateString('zh-HK')}</div>
                          )}
                          {workOrder.isCompleted && (
                            <div className="text-success-600 dark:text-success-400">✓ 已完成</div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    {/* Work Info */}
                    <td className="py-4 px-4 text-sm text-neutral-700 dark:text-white/85 align-top">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Package2 className="h-3.5 w-3.5 text-neutral-400 dark:text-white/55" aria-hidden="true" />
                          <span className="font-medium text-neutral-900 dark:text-white/95">負責人：{workOrder.personInCharge?.nickname || workOrder.personInCharge?.phoneE164 || '-'}</span>
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-white/65">
                          {workOrder.productionMaterialsReady && (
                            <div>✓ 生產物料齊</div>
                          )}
                          {workOrder.packagingMaterialsReady && (
                            <div>✓ 包裝物料齊</div>
                          )}
                          {workOrder.productionStarted && (
                            <div>✓ 已開生產線</div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    {/* Linked Order */}
                    <td className="py-4 px-4 text-neutral-900 text-sm align-top">
                      {workOrder.capsulationOrder ? (
                        <Link 
                          href={`/orders/${workOrder.capsulationOrder.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Badge variant="info" className="cursor-pointer hover:bg-info-100 dark:hover:bg-info-900/40 text-xs">
                            膠囊訂單
                          </Badge>
                        </Link>
                      ) : (
                        <span className="text-neutral-400 dark:text-white/55 text-xs">-</span>
                      )}
                    </td>
                    
                    {/* Actions */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `/work-orders/${workOrder.id}`
                          }}
                          className="text-neutral-500 hover:text-neutral-700 dark:text-white/85 transition-colors"
                          title="查看工作單"
                          aria-label="查看工作單"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `/work-orders/${workOrder.id}/edit`
                          }}
                          className="text-primary-600 hover:text-primary-800 transition-colors"
                          title="編輯工作單"
                          aria-label="編輯工作單"
                        >
                          <Edit className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setQuickEditWorkOrder(workOrder)
                          }}
                          className="text-purple-600 hover:text-purple-800 transition-colors"
                          title="快速編輯"
                          aria-label="快速編輯"
                        >
                          <Bot className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(workOrder.id)
                          }}
                          className="text-danger-600 hover:text-danger-800 transition-colors"
                          title="刪除工作單"
                          aria-label="刪除工作單"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableWrapper>
      </div>
      
      {/* Mobile cards */}
      <div className="lg:hidden space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-neutral-500 dark:text-white/65">
            載入中...
          </div>
        ) : workOrders.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 dark:text-white/65">
            沒有找到工作單
          </div>
        ) : (
          workOrders.map((workOrder) => (
            <div
              key={workOrder.id}
              className="liquid-glass-card liquid-glass-card-brand liquid-glass-card-refraction cursor-pointer"
              onClick={() => window.location.href = `/work-orders/${workOrder.id}`}
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Text.Primary as="h3" className="text-base font-semibold">{workOrder.customerName}</Text.Primary>
                    <Text.Secondary className="text-xs">{workOrder.jobNumber || '-'}</Text.Secondary>
                  </div>
                  <EditableStatusCell
                    workOrderId={workOrder.id}
                    currentStatus={workOrder.status}
                    onSuccess={() => showToast({ title: '狀態已更新' })}
                    onError={(error) => showToast({ title: '更新失敗', description: error.message, variant: 'destructive' })}
                  />
                </div>

                <div className="text-xs text-neutral-500 dark:text-white/65 space-y-1">
                  {workOrder.markedDate && (
                    <div>創建：{new Date(workOrder.markedDate).toLocaleDateString('zh-HK')}</div>
                  )}
                  <div>負責人：{workOrder.personInCharge?.nickname || workOrder.personInCharge?.phoneE164 || '-'}</div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <WorkTypeBadge workType={workOrder.workType} />
                  {workOrder.isCustomerServiceVip && (
                    <Badge variant="warning" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      客服VIP
                    </Badge>
                  )}
                  {workOrder.isBossVip && (
                    <Badge variant="danger" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      老闆VIP
                    </Badge>
                  )}
                  {workOrder.isUrgent && (
                    <Badge variant="danger" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      加急
                    </Badge>
                  )}
                </div>

                {workOrder.capsulationOrder && (
                  <div className="flex items-center gap-2">
                    <Link 
                      href={`/orders/${workOrder.capsulationOrder.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Badge variant="info" className="text-xs">
                        關聯膠囊訂單
                      </Badge>
                    </Link>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.location.href = `/work-orders/${workOrder.id}/edit`
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" aria-hidden="true" /> 編輯
                  </Button>
                  <Button
                    size="sm"
                    className="bg-primary-600 hover:bg-primary-700"
                    onClick={(e) => {
                      e.stopPropagation()
                      setQuickEditWorkOrder(workOrder)
                    }}
                  >
                    <Bot className="h-4 w-4 mr-1" aria-hidden="true" /> AI
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Quick Edit Modal */}
      {quickEditWorkOrder && (
        <QuickEditModal
          workOrder={quickEditWorkOrder}
          users={users}
          isOpen={!!quickEditWorkOrder}
          onClose={() => setQuickEditWorkOrder(null)}
          onSuccess={async () => {
            showToast({ title: '更新成功' })
            setQuickEditWorkOrder(null)
            // Call the parent's refetch function (worklog pattern)
            if (onRefresh) {
              await onRefresh()
            }
          }}
        />
      )}
    </div>
  )
}

