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

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { WorkOrder, User } from '@/types/work-order'
import { WorkOrderStatus } from '@prisma/client'
import { Badge } from '@/components/ui/badge'
import { Text } from '@/components/ui/text'
import { TableWrapper } from '@/components/ui/table-wrapper'
import { OrderLinkBadge } from '@/components/ui/order-link-badge'
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
  Calendar
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { WORK_TYPE_LABELS, WORK_ORDER_STATUS_LABELS } from '@/types/work-order'
import { QuickActionsMenu } from './quick-actions-menu'
import { useToast } from '@/components/ui/toast-provider'

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
 * Status badge component
 */
function StatusBadge({ status }: { status: string | null }) {
  // If no status (ongoing work), don't display anything
  if (!status) {
    return null
  }

  const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    PAUSED: 'warning',      // Orange for paused
    COMPLETED: 'success',   // Green for completed
    CANCELLED: 'danger'     // Red for cancelled
  }

  return (
    <Badge variant={variants[status] || 'default'} className="text-xs">
      {WORK_ORDER_STATUS_LABELS[status as keyof typeof WORK_ORDER_STATUS_LABELS] || status}
    </Badge>
  )
}

/**
 * Work type badge component with color coding
 */
function WorkTypeBadge({ workType, productionStarted }: { workType: string; productionStarted: boolean }) {
  // Color-code by work type
  const variantMap: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
    'PACKAGING': 'default',              // Blue - 包裝
    'PRODUCTION': 'success',             // Green - 生產
    'PRODUCTION_PACKAGING': 'warning',   // Orange - 生產+包裝
    'WAREHOUSING': 'info'                // Purple - 倉務
  }
  
  const variant = variantMap[workType] || 'info'
  
  return (
    <div className="flex items-center gap-1.5">
      <Badge variant={variant} className="text-xs">
        {WORK_TYPE_LABELS[workType as keyof typeof WORK_TYPE_LABELS]}
      </Badge>
      {productionStarted && (
        <span className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400">
          <Factory className="h-3 w-3" />
          生產中
        </span>
      )}
    </div>
  )
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
      <div className="hidden lg:block">
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
                    label="工作類型"
                    field="workType"
                    currentSort={sortBy}
                    currentOrder={sortOrder}
                    onSort={onSort}
                  />
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
                  <td colSpan={9} className="text-center py-8 text-neutral-500 dark:text-white/65">
                    沒有找到工作單
                  </td>
                </tr>
              ) : (
                workOrders.map((workOrder) => (
                    <tr
                      key={workOrder.id}
                      className={`border-b border-neutral-200 dark:border-neutral-700 hover:bg-surface-secondary/30 dark:hover:bg-elevation-2 transition-colors cursor-pointer`}
                      onClick={() => router.push(`/work-orders/${workOrder.id}`)}
                    >
                    {/* Customer / Job / Status / Description / VIP / Urgent */}
                    <td className="py-3 px-3 text-sm align-top max-w-md">
                      <div className="flex flex-col gap-1">
                        {/* Customer name */}
                        <div className="font-semibold text-neutral-900 dark:text-white/95 text-base">
                          {workOrder.customerName}
                        </div>
                        
                        {/* Job number + Status badge */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-500 dark:text-white/65">
                            {workOrder.jobNumber || '無編號'}
                          </span>
                          <StatusBadge status={workOrder.status} />
                        </div>
                        
                        {/* Work description (truncated to 1 line) */}
                        {workOrder.workDescription && (
                          <div
                            className="text-xs text-neutral-500 dark:text-white/65 truncate max-w-full"
                            title={workOrder.workDescription}
                          >
                            {workOrder.workDescription}
                          </div>
                        )}
                        
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
                    <td className="py-3 px-3 text-sm align-top">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-3.5 w-3.5 text-neutral-400 dark:text-white/55 flex-shrink-0" />
                        <span className="text-neutral-900 dark:text-white/95 font-medium">
                          {workOrder.personInCharge?.nickname || workOrder.personInCharge?.phoneE164 || '未指定'}
                        </span>
                      </div>
                    </td>

                    {/* Work Type + Production Started */}
                    <td className="py-3 px-3 text-sm align-top">
                      <WorkTypeBadge
                        workType={workOrder.workType}
                        productionStarted={workOrder.productionStarted}
                      />
                    </td>

                    {/* Linked Encapsulation Orders */}
                    <td className="py-3 px-3 text-sm align-top hidden xl:table-cell">
                      {workOrder.productionOrders && workOrder.productionOrders.length > 0 ? (
                        <div className="flex flex-wrap gap-1 items-center">
                          {workOrder.productionOrders.slice(0, 2).map(order => (
                            <OrderLinkBadge
                              key={order.id}
                              type="encapsulation-order"
                              orderId={order.id}
                              label={order.productName}
                              size="sm"
                            />
                          ))}
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
                        
                        {/* Packaging materials */}
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
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableWrapper>
      </div>

      {/* Mobile/Tablet view - will be updated in next step */}
      <div className="lg:hidden">
        <div className="space-y-3">
          {(isLoading || isFetching) ? (
            <>
              {[...Array(5)].map((_, i) => (
                <div key={`skeleton-${i}`} className="p-4 bg-surface-primary rounded-lg border border-neutral-200 dark:border-neutral-700">
                  {/* Customer name skeleton */}
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  {/* Job number skeleton */}
                  <Skeleton className="h-4 w-1/3 mb-3" />
                  {/* Delivery date skeleton */}
                  <Skeleton className="h-5 w-2/3 mb-2" />
                  {/* Person in charge skeleton */}
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  {/* Badges skeleton */}
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
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
            workOrders.map((workOrder) => (
              <div
                key={workOrder.id}
                className="p-4 bg-surface-primary rounded-lg border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow cursor-pointer mobile-card"
                onClick={() => router.push(`/work-orders/${workOrder.id}`)}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-1 min-w-0">
                      {/* Customer Name - LARGE */}
                      <h3 className="text-base font-semibold text-neutral-900 dark:text-white/95 mb-1 truncate">
                        {workOrder.customerName}
                      </h3>
                      
                      {/* Job Number - Small, gray */}
                      <p className="text-xs text-neutral-500 dark:text-white/65 mb-2">
                        {workOrder.jobNumber || '無編號'}
                      </p>
                      
                      {/* Delivery Date - PROMINENT with icon */}
                      {workOrder.requestedDeliveryDate && (
                        <div className="flex items-center gap-1.5 mb-2 text-sm text-neutral-700 dark:text-white/85">
                          <Calendar className="h-4 w-4 shrink-0" />
                          <span className="font-medium">
                            {new Date(workOrder.requestedDeliveryDate).toLocaleDateString('zh-HK', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                      
                      {/* Essential Info - One line each */}
                      <div className="space-y-1.5 text-sm text-neutral-700 dark:text-white/85">
                        {/* Person in charge */}
                        <div className="flex items-center gap-1.5">
                          <UserIcon className="h-3.5 w-3.5 text-neutral-500 dark:text-white/65 shrink-0" />
                          <span>{workOrder.personInCharge?.nickname || workOrder.personInCharge?.phoneE164 || '未指定'}</span>
                        </div>
                        
                        {/* Work Type + Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <WorkTypeBadge
                            workType={workOrder.workType}
                            productionStarted={workOrder.productionStarted}
                          />
                          {workOrder.isCustomerServiceVip && <Badge variant="warning" className="text-xs">客服VIP</Badge>}
                          {workOrder.isBossVip && <Badge variant="danger" className="text-xs">老闆VIP</Badge>}
                          {workOrder.isUrgent && <Badge variant="danger" className="text-xs">⚡ 加急</Badge>}
                          {workOrder.status && <StatusBadge status={workOrder.status} />}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Actions - Right side */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <QuickActionsMenu
                      workOrder={workOrder}
                      onDelete={onDelete}
                      onStatusChange={handleStatusChange}
                      onToggleMaterialReady={handleToggleMaterialReady}
                      onToggleProductionStarted={handleToggleProductionStarted}
                      onRefresh={onRefresh}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
