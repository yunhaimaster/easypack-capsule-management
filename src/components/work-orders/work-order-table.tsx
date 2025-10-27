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
import { WorkOrder, User } from '@/types/work-order'
import { WorkOrderStatus } from '@prisma/client'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Text } from '@/components/ui/text'
import { TableWrapper } from '@/components/ui/table-wrapper'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Factory,
  User as UserIcon
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { WORK_TYPE_LABELS, WORK_ORDER_STATUS_LABELS } from '@/types/work-order'
import { QuickActionsMenu } from './quick-actions-menu'
import { useToast } from '@/components/ui/toast-provider'
import { WorkOrderPopup } from './work-order-popup'

interface WorkOrderTableProps {
  workOrders: WorkOrder[]
  users: User[]
  isLoading: boolean
  isFetching: boolean
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
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
    <Badge variant={variants[status] || 'default'} className="text-xs">
      {WORK_ORDER_STATUS_LABELS[status as keyof typeof WORK_ORDER_STATUS_LABELS]}
    </Badge>
  )
}

/**
 * Work type badge component
 */
function WorkTypeBadge({ workType, productionStarted }: { workType: string; productionStarted: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="info" className="text-xs">
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
  selectedIds,
  onSelectionChange,
  onSort,
  sortBy,
  sortOrder,
  onDelete,
  onRefresh
}: WorkOrderTableProps) {
  const { showToast } = useToast()

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(workOrders.map(wo => wo.id))
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id])
    } else {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id))
    }
  }

  const handleToggle = async (
    workOrderId: string,
    field: 'productionStarted' | 'productionMaterialsReady' | 'packagingMaterialsReady',
    value: boolean
  ) => {
    // Handled by QuickActionsMenu
  }

  const handleStatusChange = async (workOrderId: string, newStatus: WorkOrderStatus) => {
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

  const allSelected = workOrders.length > 0 && selectedIds.length === workOrders.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < workOrders.length

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
                <th className="px-3 py-3 w-8">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="選擇全部"
                  />
                </th>
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
              {isLoading ? (
                <>
                  {[...Array(10)].map((_, i) => (
                    <SkeletonRow key={`skeleton-${i}`} />
                  ))}
                </>
              ) : workOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-neutral-500 dark:text-white/65">
                    沒有找到工作單
                  </td>
                </tr>
              ) : (
                workOrders.map((workOrder) => (
                  <WorkOrderPopup key={workOrder.id} workOrder={workOrder} side="top">
                    <tr
                      className="border-b border-neutral-200 dark:border-neutral-700 hover:bg-surface-secondary/30 dark:hover:bg-elevation-2 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/work-orders/${workOrder.id}`}
                    >
                    {/* Checkbox */}
                    <td className="px-3 py-3">
                      <Checkbox
                        checked={selectedIds.includes(workOrder.id)}
                        onCheckedChange={(checked) => handleSelectRow(workOrder.id, checked as boolean)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`選擇 ${workOrder.jobNumber || workOrder.customerName}`}
                      />
                    </td>

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
                        </div>
                      </div>
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
                        onRefresh={onRefresh}
                      />
                    </td>
                  </tr>
                  </WorkOrderPopup>
                ))
              )}
            </tbody>
          </table>
        </TableWrapper>
      </div>

      {/* Mobile/Tablet view - will be updated in next step */}
      <div className="lg:hidden">
        <div className="space-y-3">
          {isLoading ? (
            <>
              {[...Array(5)].map((_, i) => (
                <div key={`skeleton-${i}`} className="p-4 bg-surface-primary rounded-lg">
                  <Skeleton className="h-24 w-full" />
                </div>
              ))}
            </>
          ) : workOrders.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 dark:text-white/65">
              沒有找到工作單
            </div>
          ) : (
            workOrders.map((workOrder) => (
              <div
                key={workOrder.id}
                className="p-4 bg-surface-primary rounded-lg border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => window.location.href = `/work-orders/${workOrder.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <Checkbox
                      checked={selectedIds.includes(workOrder.id)}
                      onCheckedChange={(checked) => handleSelectRow(workOrder.id, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`選擇 ${workOrder.jobNumber || workOrder.customerName}`}
                    />
                    <div className="flex-1 space-y-2">
                      {/* Customer name */}
                      <div className="font-semibold text-neutral-900 dark:text-white/95 text-base">
                        {workOrder.customerName}
                      </div>
                      
                      {/* Job number + Status */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-neutral-500 dark:text-white/65">
                          {workOrder.jobNumber || '無編號'}
                        </span>
                        <StatusBadge status={workOrder.status} />
                        <WorkTypeBadge
                          workType={workOrder.workType}
                          productionStarted={workOrder.productionStarted}
                        />
                      </div>
                      
                      {/* VIP badges */}
                      {(workOrder.isCustomerServiceVip || workOrder.isBossVip || workOrder.isUrgent) && (
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
                        </div>
                      )}
                      
                      {/* Person in charge */}
                      <div className="text-sm text-neutral-700 dark:text-white/85">
                        <span className="font-medium">負責人: </span>
                        {workOrder.personInCharge?.nickname || workOrder.personInCharge?.phoneE164 || '未指定'}
                      </div>
                      
                      {/* Quantity */}
                      <div className="text-sm text-neutral-700 dark:text-white/85">
                        <span className="font-medium">數量: </span>
                        {workOrder.productionQuantity && `生產 ${workOrder.productionQuantity}${workOrder.productionQuantityStat || '個'}`}
                        {workOrder.productionQuantity && workOrder.packagingQuantity && ' / '}
                        {workOrder.packagingQuantity && `包裝 ${workOrder.packagingQuantity}${workOrder.packagingQuantityStat || '個'}`}
                        {!workOrder.productionQuantity && !workOrder.packagingQuantity && '-'}
                      </div>
                      
                      {/* Materials */}
                      <div className="text-sm space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-neutral-700 dark:text-white/85">物料: </span>
                          {workOrder.productionMaterialsReady ? (
                            <span className="text-success-700 dark:text-success-400 text-xs">生產 ✓</span>
                          ) : (
                            <span className="text-neutral-500 dark:text-white/65 text-xs">生產 ✗</span>
                          )}
                          {workOrder.packagingMaterialsReady ? (
                            <span className="text-success-700 dark:text-success-400 text-xs">包裝 ✓</span>
                          ) : (
                            <span className="text-neutral-500 dark:text-white/65 text-xs">包裝 ✗</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Created date */}
                      <div className="text-xs text-neutral-500 dark:text-white/65">
                        {workOrder.markedDate
                          ? new Date(workOrder.markedDate).toLocaleDateString('zh-HK')
                          : '-'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions dropdown */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <QuickActionsMenu
                      workOrder={workOrder}
                      onDelete={onDelete}
                      onStatusChange={handleStatusChange}
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
