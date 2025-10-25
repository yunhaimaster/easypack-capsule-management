/**
 * Work Order Table Component
 * 
 * Smart table with skeleton loader, sorting, and row selection.
 * Displays work orders with status badges, person in charge, and actions.
 */

import { useState } from 'react'
import Link from 'next/link'
import { WorkOrder, User } from '@/types/work-order'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2, ArrowUpDown, CheckCircle, XCircle, AlertCircle, Star, Edit3 } from 'lucide-react'
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
  users,
  isLoading,
  isFetching,
  selectedIds,
  onSelectionChange,
  onSort,
  sortBy,
  sortOrder,
  onDelete
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
              <span className="text-sm text-neutral-700 dark:text-white/85">更新中...</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-secondary border-b border-neutral-200 dark:border-neutral-700">
            <tr>
              {/* Checkbox - Always visible */}
              <th className="px-2 sm:px-4 py-3 w-8 sm:w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="選擇全部"
                />
              </th>
              
              {/* Customer Name - Always visible (MOST IMPORTANT) */}
              <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-neutral-700 dark:text-white/85 min-w-[120px] sm:min-w-[160px]">
                <div className="flex items-center gap-2 cursor-pointer hover:bg-surface-secondary/50 transition-colors" onClick={() => onSort('customerName')}>
                  <span>客戶名稱</span>
                  <ArrowUpDown className={`h-3 w-3 sm:h-4 sm:w-4 ${sortBy === 'customerName' ? 'text-primary-600' : 'text-neutral-400 dark:text-white/55'}`} />
                  {sortBy === 'customerName' && (
                    <span className="text-xs text-primary-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              
              {/* Status - Always visible (CRITICAL INFO) */}
              <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-neutral-700 dark:text-white/85">
                <div className="flex items-center gap-2 cursor-pointer hover:bg-surface-secondary/50 transition-colors" onClick={() => onSort('status')}>
                  <span>狀態</span>
                  <ArrowUpDown className={`h-3 w-3 sm:h-4 sm:w-4 ${sortBy === 'status' ? 'text-primary-600' : 'text-neutral-400 dark:text-white/55'}`} />
                  {sortBy === 'status' && (
                    <span className="text-xs text-primary-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              
              {/* Job Number - Hidden on mobile, visible md+ */}
              <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-white/85">
                <div className="flex items-center gap-2 cursor-pointer hover:bg-surface-secondary/50 transition-colors" onClick={() => onSort('jobNumber')}>
                  <span>訂單編號</span>
                  <ArrowUpDown className={`h-4 w-4 ${sortBy === 'jobNumber' ? 'text-primary-600' : 'text-neutral-400 dark:text-white/55'}`} />
                  {sortBy === 'jobNumber' && (
                    <span className="text-xs text-primary-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              
              {/* Work Type - Hidden on mobile, visible sm+ */}
              <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-white/85">
                工作類型
              </th>
              
              {/* Person in Charge - Hidden on mobile/tablet, visible lg+ */}
              <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-white/85">
                負責人
              </th>
              
              {/* VIP Marks - Hidden on mobile/tablet, visible lg+ */}
              <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-white/85">
                VIP標記
              </th>
              
              {/* Linked Order - Hidden on mobile/tablet, visible lg+ */}
              <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-white/85">
                關聯訂單
              </th>
              
              {/* Material Status - Hidden on mobile/tablet, visible xl+ */}
              <th className="hidden xl:table-cell px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-white/85">
                物料狀態
              </th>
              
              {/* Status Marks - Hidden on mobile/tablet, visible xl+ */}
              <th className="hidden xl:table-cell px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-white/85">
                狀態標記
              </th>
              
              {/* Created Date - Hidden on mobile/tablet, visible lg+ */}
              <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-white/85">
                <div className="flex items-center gap-2 cursor-pointer hover:bg-surface-secondary/50 transition-colors" onClick={() => onSort('markedDate')}>
                  <span>創建日期</span>
                  <ArrowUpDown className={`h-4 w-4 ${sortBy === 'markedDate' ? 'text-primary-600' : 'text-neutral-400 dark:text-white/55'}`} />
                  {sortBy === 'markedDate' && (
                    <span className="text-xs text-primary-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              
              {/* Actions - Always visible (CRITICAL) */}
              <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-neutral-700 dark:text-white/85 sticky right-0 bg-surface-secondary">
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
                  border-b border-neutral-200 dark:border-neutral-700 transition-colors
                  ${selectedIds.includes(workOrder.id) ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-surface-secondary/50'}
                  ${hoveredRow === workOrder.id ? 'shadow-sm' : ''}
                `}
                onMouseEnter={() => setHoveredRow(workOrder.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Checkbox - Always visible */}
                <td className="px-2 sm:px-4 py-3">
                  <Checkbox
                    checked={selectedIds.includes(workOrder.id)}
                    onCheckedChange={(checked) => handleSelectRow(workOrder.id, checked as boolean)}
                    aria-label={`選擇 ${workOrder.jobNumber || workOrder.customerName}`}
                  />
                </td>
                
                {/* Customer Name - Always visible */}
                <td className="px-2 sm:px-4 py-3">
                  <Link
                    href={`/work-orders/${workOrder.id}` as never}
                    className="text-neutral-800 dark:text-white/95 hover:text-primary-600 hover:underline font-medium text-sm sm:text-base"
                  >
                    {workOrder.customerName}
                  </Link>
                </td>
                
                {/* Status - Always visible */}
                <td className="px-2 sm:px-4 py-3">
                  <EditableStatusCell
                    workOrderId={workOrder.id}
                    currentStatus={workOrder.status}
                    onSuccess={() => showToast({ title: '狀態已更新' })}
                    onError={(error) => showToast({ title: '更新失敗', description: error.message, variant: 'destructive' })}
                  />
                </td>
                
                {/* Job Number - Hidden on mobile, visible md+ */}
                <td className="hidden md:table-cell px-4 py-3">
                  <Link
                    href={`/work-orders/${workOrder.id}` as never}
                    className="text-primary-600 hover:text-primary-700 hover:underline font-medium text-sm"
                  >
                    {workOrder.jobNumber || '-'}
                  </Link>
                </td>
                
                {/* Work Type - Hidden on mobile, visible sm+ */}
                <td className="hidden sm:table-cell px-4 py-3">
                  <WorkTypeBadge workType={workOrder.workType} />
                </td>
                
                {/* Person in Charge - Hidden on mobile/tablet, visible lg+ */}
                <td className="hidden lg:table-cell px-4 py-3 text-neutral-700 dark:text-white/85 text-sm">
                  {workOrder.personInCharge?.nickname || workOrder.personInCharge?.phoneE164 || '-'}
                </td>
                
                {/* VIP Marks - Hidden on mobile/tablet, visible lg+ */}
                <td className="hidden lg:table-cell px-4 py-3">
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
                
                {/* Linked Order - Hidden on mobile/tablet, visible lg+ */}
                <td className="hidden lg:table-cell px-4 py-3">
                  {workOrder.capsulationOrder ? (
                    <Link href={`/orders/${workOrder.capsulationOrder.id}`}>
                      <Badge variant="info" className="cursor-pointer hover:bg-info-100 dark:hover:bg-info-900/40 text-xs">
                        膠囊訂單
                      </Badge>
                    </Link>
                  ) : (
                    <span className="text-neutral-400 dark:text-white/55 text-xs">-</span>
                  )}
                </td>
                
                {/* Material Status - Hidden on mobile/tablet, visible xl+ */}
                <td className="hidden xl:table-cell px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <EditableCheckboxCell
                      workOrderId={workOrder.id}
                      field="productionMaterialsReady"
                      currentValue={workOrder.productionMaterialsReady}
                      label="生產物料齊"
                      onSuccess={() => showToast({ title: '物料狀態已更新' })}
                      onError={(error) => showToast({ title: '更新失敗', description: error.message, variant: 'destructive' })}
                    />
                    <EditableCheckboxCell
                      workOrderId={workOrder.id}
                      field="packagingMaterialsReady"
                      currentValue={workOrder.packagingMaterialsReady}
                      label="包裝物料齊"
                      onSuccess={() => showToast({ title: '物料狀態已更新' })}
                      onError={(error) => showToast({ title: '更新失敗', description: error.message, variant: 'destructive' })}
                    />
                  </div>
                </td>
                
                {/* Status Marks - Hidden on mobile/tablet, visible xl+ */}
                <td className="hidden xl:table-cell px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <EditableCheckboxCell
                      workOrderId={workOrder.id}
                      field="productionStarted"
                      currentValue={workOrder.productionStarted}
                      label="已開生產線"
                      onSuccess={() => showToast({ title: '生產狀態已更新' })}
                      onError={(error) => showToast({ title: '更新失敗', description: error.message, variant: 'destructive' })}
                    />
                    {workOrder.isUrgent && (
                      <Badge variant="danger" className="text-xs w-fit">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        加急
                      </Badge>
                    )}
                    {workOrder.isCompleted && (
                      <Badge variant="success" className="text-xs w-fit">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        完成
                      </Badge>
                    )}
                  </div>
                </td>
                
                {/* Created Date - Hidden on mobile/tablet, visible lg+ */}
                <td className="hidden lg:table-cell px-4 py-3 text-neutral-700 dark:text-white/85 text-sm">
                  {workOrder.markedDate 
                    ? new Date(workOrder.markedDate).toLocaleDateString('zh-HK')
                    : '-'
                  }
                </td>
                
                {/* Actions - Always visible, sticky on mobile */}
                <td className="px-2 sm:px-4 py-3 sticky right-0 bg-surface-primary dark:bg-surface-primary">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                      onClick={() => setQuickEditWorkOrder(workOrder)}
                      title="快速編輯"
                    >
                      <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="sr-only">快速編輯</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                    >
                      <Link href={`/work-orders/${workOrder.id}`}>
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="sr-only">查看</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 hidden sm:flex"
                    >
                      <Link href={`/work-orders/${workOrder.id}/edit`}>
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="sr-only">編輯</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-danger-600 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-900/20 hidden sm:flex"
                      onClick={() => onDelete(workOrder.id)}
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="sr-only">刪除</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Quick Edit Modal */}
      {quickEditWorkOrder && (
        <QuickEditModal
          workOrder={quickEditWorkOrder}
          users={users}
          isOpen={!!quickEditWorkOrder}
          onClose={() => setQuickEditWorkOrder(null)}
          onSuccess={() => {
            showToast({ title: '更新成功' })
            setQuickEditWorkOrder(null)
          }}
        />
      )}
    </div>
  )
}

