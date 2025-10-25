/**
 * Work Order Table Component
 * 
 * Smart table with skeleton loader, sorting, and row selection.
 * Displays work orders with status badges, person in charge, and actions.
 */

import { useState } from 'react'
import Link from 'next/link'
import { WorkOrder } from '@/types/work-order'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2, ArrowUpDown, CheckCircle, XCircle, AlertCircle, Star } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { WORK_TYPE_LABELS, WORK_ORDER_STATUS_LABELS } from '@/types/work-order'

interface WorkOrderTableProps {
  workOrders: WorkOrder[]
  isLoading: boolean
  isFetching: boolean
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onSort: (field: string) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
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
        <Skeleton className="h-5 w-32" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-5 w-48" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-6 w-20" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-6 w-16" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-5 w-24" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-5 w-20" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-5 w-24" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-5 w-28" />
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
 * Status badge with color coding
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
  
  return (
    <Badge variant={variants[status] || 'default'}>
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
 * Main table component
 */
export function WorkOrderTable({
  workOrders,
  isLoading,
  isFetching,
  selectedIds,
  onSelectionChange,
  onSort,
  sortBy,
  sortOrder
}: WorkOrderTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  
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
              <span className="text-sm text-neutral-700 dark:text-white/85">更新中...</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-secondary border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="選擇全部"
                />
              </th>
              <SortableHeader
                field="jobNumber"
                label="訂單編號"
                currentSort={sortBy}
                sortOrder={sortOrder}
                onSort={onSort}
              />
              <SortableHeader
                field="customerName"
                label="客戶名稱"
                currentSort={sortBy}
                sortOrder={sortOrder}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-white/85">
                VIP標記
              </th>
              <SortableHeader
                field="status"
                label="狀態"
                currentSort={sortBy}
                sortOrder={sortOrder}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-white/85">
                工作類型
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-white/85">
                負責人
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-white/85">
                物料狀態
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-white/85">
                狀態標記
              </th>
              <SortableHeader
                field="markedDate"
                label="創建日期"
                currentSort={sortBy}
                sortOrder={sortOrder}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-white/85">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Skeleton loader for initial load */}
            {isLoading && (
              <>
                {[...Array(10)].map((_, i) => (
                  <SkeletonRow key={`skeleton-${i}`} />
                ))}
              </>
            )}
            
            {/* Actual data rows */}
            {!isLoading && workOrders.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-neutral-500 dark:text-white/65">
                  沒有找到工作單
                </td>
              </tr>
            )}
            
            {!isLoading && workOrders.map((workOrder) => (
              <tr
                key={workOrder.id}
                className={`
                  border-b border-neutral-200 transition-colors
                  ${selectedIds.includes(workOrder.id) ? 'bg-primary-50' : 'hover:bg-surface-secondary/50'}
                  ${hoveredRow === workOrder.id ? 'shadow-sm' : ''}
                `}
                onMouseEnter={() => setHoveredRow(workOrder.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <td className="px-4 py-3">
                  <Checkbox
                    checked={selectedIds.includes(workOrder.id)}
                    onCheckedChange={(checked) => handleSelectRow(workOrder.id, checked as boolean)}
                    aria-label={`選擇 ${workOrder.jobNumber || workOrder.customerName}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/work-orders/${workOrder.id}` as never}
                    className="text-primary-600 hover:text-primary-700 hover:underline font-medium"
                  >
                    {workOrder.jobNumber || '-'}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-800 dark:text-white/95">
                  {workOrder.customerName}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 flex-wrap">
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
                    {!workOrder.isCustomerServiceVip && !workOrder.isBossVip && (
                      <span className="text-neutral-400 dark:text-white/55 text-xs">-</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={workOrder.status} />
                </td>
                <td className="px-4 py-3">
                  <WorkTypeBadge workType={workOrder.workType} />
                </td>
                <td className="px-4 py-3 text-neutral-700 dark:text-white/85">
                  {workOrder.personInCharge?.nickname || workOrder.personInCharge?.phoneE164 || '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-xs">
                    {workOrder.productionMaterialsReady ? (
                      <div className="flex items-center gap-1 text-success-600" title="生產物料齊">
                        <CheckCircle className="h-4 w-4" />
                        <span>生產</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-neutral-400 dark:text-white/55" title="生產物料未齊">
                        <XCircle className="h-4 w-4" />
                        <span>生產</span>
                      </div>
                    )}
                    {workOrder.packagingMaterialsReady ? (
                      <div className="flex items-center gap-1 text-success-600" title="包裝物料齊">
                        <CheckCircle className="h-4 w-4" />
                        <span>包裝</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-neutral-400 dark:text-white/55" title="包裝物料未齊">
                        <XCircle className="h-4 w-4" />
                        <span>包裝</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 flex-wrap">
                    {workOrder.isUrgent && (
                      <Badge variant="danger" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        加急
                      </Badge>
                    )}
                    {workOrder.productionStarted && (
                      <Badge variant="info" className="text-xs">
                        生產中
                      </Badge>
                    )}
                    {workOrder.isCompleted && (
                      <Badge variant="success" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        完成
                      </Badge>
                    )}
                    {!workOrder.isUrgent && !workOrder.productionStarted && !workOrder.isCompleted && (
                      <span className="text-neutral-400 dark:text-white/55 text-xs">-</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-700 dark:text-white/85 text-sm">
                  {workOrder.markedDate 
                    ? new Date(workOrder.markedDate).toLocaleDateString('zh-HK')
                    : '-'
                  }
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <Link href={`/work-orders/${workOrder.id}` as never}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">查看</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <Link href={`/work-orders/${workOrder.id}/edit` as never}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">編輯</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                      onClick={() => {
                        // Delete handler will be passed from parent
                        console.log('Delete', workOrder.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">刪除</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

