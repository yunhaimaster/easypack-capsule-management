/**
 * Quick Actions Dropdown Menu for Work Orders
 * 
 * Consolidates all work order actions into a single dropdown:
 * - View/Edit
 * - Quick updates (status, toggles)
 * - Relations (linked orders)
 * - Export/Delete
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Eye,
  Edit,
  CheckCircle,
  Factory,
  Package,
  Package2,
  Link,
  Trash2,
  MoreVertical,
  Loader2
} from 'lucide-react'
import { WorkOrder, WORK_ORDER_STATUS_LABELS } from '@/types/work-order'
import { WorkOrderStatus } from '@prisma/client'
import { useToast } from '@/components/ui/toast-provider'

interface QuickActionsMenuProps {
  workOrder: WorkOrder
  onDelete: (id: string) => void
  onStatusChange?: (id: string, newStatus: WorkOrderStatus) => Promise<void>
  onToggleMaterialReady?: (id: string, field: 'production' | 'packaging', value: boolean) => Promise<void>
  onToggleProductionStarted?: (id: string, value: boolean) => Promise<void>
  onRefresh?: () => void
}

export function QuickActionsMenu({
  workOrder,
  onDelete,
  onStatusChange,
  onToggleMaterialReady,
  onToggleProductionStarted,
  onRefresh
}: QuickActionsMenuProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const handleAction = async (
    action: string,
    asyncFn: () => Promise<void>,
    successMessage: string
  ) => {
    setIsLoading(true)
    setLoadingAction(action)
    try {
      await asyncFn()
      showToast({ title: successMessage })
      onRefresh?.()
    } catch (error) {
      showToast({ 
        title: '操作失敗', 
        variant: 'destructive' 
      })
      console.error(`[QuickActions] ${action} failed:`, error)
    } finally {
      setIsLoading(false)
      setLoadingAction(null)
    }
  }

  const handleToggle = async (
    field: 'productionStarted' | 'productionMaterialsReady' | 'packagingMaterialsReady',
    currentValue: boolean
  ) => {
    const response = await fetch(`/api/work-orders/${workOrder.id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field, value: !currentValue })
    })

    if (!response.ok) {
      throw new Error('Toggle failed')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-9 w-9"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MoreVertical className="h-4 w-4" />
        )}
        <span className="sr-only">操作選單</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Group 1: View/Edit */}
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/work-orders/${workOrder.id}`)
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          <span>查看詳情</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/work-orders/${workOrder.id}/edit`)
          }}
        >
          <Edit className="mr-2 h-4 w-4" />
          <span>編輯</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Group 2: Quick Updates */}
        {onStatusChange && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>更改狀態</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {Object.entries(WORK_ORDER_STATUS_LABELS).map(([status, label]) => (
                <DropdownMenuItem
                  key={status}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAction(
                      'status-change',
                      () => onStatusChange(workOrder.id, status as WorkOrderStatus),
                      `狀態已更改為：${label}`
                    )
                  }}
                  disabled={workOrder.status === status || isLoading}
                >
                  {label}
                  {workOrder.status === status && ' (目前)'}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {onToggleProductionStarted && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              handleAction(
                'toggle-production-started',
                () => handleToggle('productionStarted', workOrder.productionStarted),
                workOrder.productionStarted ? '已標記為未開工' : '已標記為已開工'
              )
            }}
            disabled={isLoading}
          >
            <Factory className="mr-2 h-4 w-4" />
            <span>{workOrder.productionStarted ? '取消已開工' : '標記已開工'}</span>
            {loadingAction === 'toggle-production-started' && (
              <Loader2 className="ml-auto h-4 w-4 animate-spin" />
            )}
          </DropdownMenuItem>
        )}

        {onToggleMaterialReady && (
          <>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                handleAction(
                  'toggle-production-materials',
                  () => handleToggle('productionMaterialsReady', workOrder.productionMaterialsReady),
                  workOrder.productionMaterialsReady ? '生產物料已標記為未齊' : '生產物料已標記為齊全'
                )
              }}
              disabled={isLoading}
            >
              <Package className="mr-2 h-4 w-4" />
              <span>{workOrder.productionMaterialsReady ? '取消生產物料齊' : '標記生產物料齊'}</span>
              {loadingAction === 'toggle-production-materials' && (
                <Loader2 className="ml-auto h-4 w-4 animate-spin" />
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                handleAction(
                  'toggle-packaging-materials',
                  () => handleToggle('packagingMaterialsReady', workOrder.packagingMaterialsReady),
                  workOrder.packagingMaterialsReady ? '包裝物料已標記為未齊' : '包裝物料已標記為齊全'
                )
              }}
              disabled={isLoading}
            >
              <Package2 className="mr-2 h-4 w-4" />
              <span>{workOrder.packagingMaterialsReady ? '取消包裝物料齊' : '標記包裝物料齊'}</span>
              {loadingAction === 'toggle-packaging-materials' && (
                <Loader2 className="ml-auto h-4 w-4 animate-spin" />
              )}
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        {/* Group 3: Relations (conditional) */}
        {workOrder.capsulationOrder && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/orders/${workOrder.capsulationOrder?.id}`)
            }}
          >
            <Link className="mr-2 h-4 w-4" />
            <span>查看關聯訂單</span>
          </DropdownMenuItem>
        )}

        {workOrder.capsulationOrder && <DropdownMenuSeparator />}

        {/* Group 4: Delete */}
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onDelete(workOrder.id)
          }}
          className="text-danger-600 focus:text-danger-600"
          disabled={isLoading}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>刪除</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

