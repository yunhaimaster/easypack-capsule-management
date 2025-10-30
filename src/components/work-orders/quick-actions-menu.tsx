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

import { useState, useEffect } from 'react'
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
  Link2,
  Unlink,
  Trash2,
  MoreVertical,
  Loader2,
  Star,
  AlertTriangle,
  Plus,
  Calendar,
  CalendarX
} from 'lucide-react'
import { WorkOrder, WORK_ORDER_STATUS_LABELS, VALID_STATUS_TRANSITIONS, getValidStatusTransitions } from '@/types/work-order'
import { WorkOrderStatus, WorkType } from '@prisma/client'
import { useToast } from '@/components/ui/toast-provider'
import { LinkOrderModal } from '@/components/orders/link-order-modal'
import { LiquidGlassConfirmModal } from '@/components/ui/liquid-glass-modal'
import { useAuth } from '@/components/auth/auth-provider'

interface QuickActionsMenuProps {
  workOrder: WorkOrder
  onDelete: (id: string) => void
  onStatusChange?: (id: string, newStatus: WorkOrderStatus | null) => Promise<void>
  onToggleMaterialReady?: (id: string, field: 'production' | 'packaging', value: boolean) => Promise<void>
  onToggleProductionStarted?: (id: string, value: boolean) => Promise<void>
  onRefresh?: () => Promise<void>  // Fixed: should be async
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
  const { isManager, isAdmin } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [isInScheduling, setIsInScheduling] = useState<boolean | null>(null)
  const [schedulingEntryId, setSchedulingEntryId] = useState<string | null>(null)

  // Check if work order is in scheduling table
  const checkSchedulingStatus = async () => {
    try {
      const response = await fetch(`/api/manager-scheduling/check/${workOrder.id}`, {
        credentials: 'include',
        cache: 'no-store'
      })
      
      if (response.ok) {
        const data = await response.json()
        setIsInScheduling(data.data?.isInScheduling || false)
        setSchedulingEntryId(data.data?.entryId || null)
      }
    } catch (error) {
      console.error('Failed to check scheduling status:', error)
    }
  }

  // Check on mount and when work order changes
  useEffect(() => {
    if ((isManager || isAdmin) && 
        (workOrder.workType === WorkType.PRODUCTION || workOrder.workType === WorkType.PRODUCTION_PACKAGING)) {
      checkSchedulingStatus()
    }
  }, [workOrder.id, isManager, isAdmin])

  const handleAddToScheduling = async () => {
    setIsLoading(true)
    setLoadingAction('add-to-scheduling')
    try {
      const response = await fetch('/api/manager-scheduling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ workOrderId: workOrder.id })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '新增失敗')
      }

      showToast({ title: '已加入排單表' })
      setIsInScheduling(true)
      await checkSchedulingStatus()
      if (onRefresh) await onRefresh()
    } catch (error) {
      showToast({
        title: '操作失敗',
        description: error instanceof Error ? error.message : '未知錯誤',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
      setLoadingAction(null)
    }
  }

  const handleRemoveFromScheduling = async () => {
    if (!schedulingEntryId) return

    setIsLoading(true)
    setLoadingAction('remove-from-scheduling')
    try {
      const response = await fetch(`/api/manager-scheduling/${schedulingEntryId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '移除失敗')
      }

      showToast({ title: '已從排單表移除' })
      setIsInScheduling(false)
      setSchedulingEntryId(null)
      await checkSchedulingStatus()
      if (onRefresh) await onRefresh()
    } catch (error) {
      showToast({
        title: '操作失敗',
        description: error instanceof Error ? error.message : '未知錯誤',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
      setLoadingAction(null)
    }
  }

  const handleAction = async (
    action: string,
    asyncFn: () => Promise<string | void>,  // Can return success message
    successMessage: string,
    skipRefresh = false
  ) => {
    setIsLoading(true)
    setLoadingAction(action)
    try {
      const result = await asyncFn()
      const message = result || successMessage
      showToast({ title: message })
      // Only refresh if not skipped (status changes handle their own refresh)
      if (!skipRefresh && onRefresh) {
        await onRefresh()  // Fixed: await the refresh to complete before finishing
      }
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
    field: 'productionStarted' | 'productionMaterialsReady' | 'packagingMaterialsReady' | 'isCompleted' | 'isCustomerServiceVip' | 'isBossVip' | 'isUrgent',
    currentValue: boolean
  ) => {
    const response = await fetch(`/api/work-orders/${workOrder.id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field, value: !currentValue }),
      cache: 'no-store'  // Prevent caching
    })

    if (!response.ok) {
      throw new Error('Toggle failed')
    }

    // Return field-specific success message
    const fieldLabels: Record<string, { on: string, off: string }> = {
      productionMaterialsReady: { on: '生產物料已標記為齊全', off: '生產物料已標記為未齊' },
      packagingMaterialsReady: { on: '包裝物料已標記為齊全', off: '包裝物料已標記為未齊' },
      productionStarted: { on: '已標記為已開工', off: '已標記為未開工' },
      isCompleted: { on: '已標記為已完成', off: '已標記為未完成' },
      isCustomerServiceVip: { on: '已標記為客服VIP', off: '已取消客服VIP' },
      isBossVip: { on: '已標記為老闆VIP', off: '已取消老闆VIP' },
      isUrgent: { on: '已標記為加急', off: '已取消加急' }
    }

    return fieldLabels[field]?.[!currentValue ? 'on' : 'off'] || '更新成功'
  }


  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-10 w-10 lg:h-9 lg:w-9"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 lg:h-4 lg:w-4 animate-spin" />
        ) : (
          <MoreVertical className="h-5 w-5 lg:h-4 lg:w-4" />
        )}
        <span className="sr-only">操作選單</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        side="bottom"
        alignOffset={-10}
        sideOffset={8}
        className="w-64 lg:w-56"
        avoidCollisions={true}
        collisionPadding={16}
      >
        {/* Group 1: View/Edit */}
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/work-orders/${workOrder.id}`)
          }}
          className="h-12 lg:h-auto"
        >
          <Eye className="mr-2 h-4 w-4" />
          <span>查看詳情</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/work-orders/${workOrder.id}/edit`)
          }}
          className="h-12 lg:h-auto"
        >
          <Edit className="mr-2 h-4 w-4" />
          <span>編輯</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Group: Relations - Context-aware */}
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/orders/new?workOrderId=${workOrder.id}`)
          }}
          className="h-12 lg:h-auto text-success-600 focus:text-success-700 focus:bg-success-50 dark:focus:bg-success-900/20"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span>創建膠囊訂單</span>
        </DropdownMenuItem>
        
        {workOrder.productionOrders && workOrder.productionOrders.length > 0 ? (
          <>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/orders/${workOrder.productionOrders![0].id}`)
              }}
              className="h-12 lg:h-auto"
            >
              <Eye className="mr-2 h-4 w-4 text-info-600" />
              <span>查看已關聯訂單{workOrder.productionOrders.length > 1 ? ` (${workOrder.productionOrders.length})` : ''}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                setLinkModalOpen(true)
              }}
              className="h-12 lg:h-auto"
            >
              <Link2 className="mr-2 h-4 w-4 text-info-600" />
              <span>關聯更多訂單</span>
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              setLinkModalOpen(true)
            }}
            className="h-12 lg:h-auto"
          >
            <Link2 className="mr-2 h-4 w-4 text-info-600" />
            <span>關聯膠囊訂單</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Group 2: Quick Updates */}
        {onStatusChange && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>更改狀態</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {(() => {
                // Get valid transitions for current status
                const validTransitions = getValidStatusTransitions(workOrder.status)
                
                // If no valid transitions, show disabled message
                if (validTransitions.length === 0) {
                  return (
                    <DropdownMenuItem disabled>
                      <span className="text-neutral-500 text-xs">
                        此狀態無法變更（終態）
                      </span>
                    </DropdownMenuItem>
                  )
                }
                
                return (
                  <>
                    {/* UNPAUSE option - show FIRST when paused */}
                    {validTransitions.includes(null) && workOrder.status === 'PAUSED' && (
                      <>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAction(
                              'status-unpause',
                              () => onStatusChange(workOrder.id, null),
                              '工作單已恢復進行',
                              true
                            )
                          }}
                          disabled={isLoading}
                          className="h-12 lg:h-auto"
                        >
                          <span className="text-primary-600">恢復進行</span>
                          {loadingAction === 'status-unpause' && (
                            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    {/* Show PAUSED if it's a valid transition */}
                    {validTransitions.includes('PAUSED') && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAction(
                            'status-paused',
                            () => onStatusChange(workOrder.id, 'PAUSED'),
                            '狀態已更改為：已暫停',
                            true
                          )
                        }}
                        disabled={isLoading}
                        className="h-12 lg:h-auto"
                      >
                        <span className="text-warning-600">已暫停</span>
                        {loadingAction === 'status-paused' && (
                          <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                        )}
                      </DropdownMenuItem>
                    )}
                    
                    {/* Show COMPLETED if it's a valid transition */}
                    {validTransitions.includes('COMPLETED') && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAction(
                            'status-completed',
                            () => onStatusChange(workOrder.id, 'COMPLETED'),
                            '狀態已更改為：已完成',
                            true
                          )
                        }}
                        disabled={isLoading}
                        className="h-12 lg:h-auto"
                      >
                        <span className="text-success-600">已完成</span>
                        {loadingAction === 'status-completed' && (
                          <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                        )}
                      </DropdownMenuItem>
                    )}
                    
                    {/* Show CANCELLED if it's a valid transition */}
                    {validTransitions.includes('CANCELLED') && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAction(
                            'status-cancelled',
                            () => onStatusChange(workOrder.id, 'CANCELLED'),
                            '狀態已更改為：已取消',
                            true
                          )
                        }}
                        disabled={isLoading}
                        className="h-12 lg:h-auto"
                      >
                        <span className="text-danger-600">已取消</span>
                        {loadingAction === 'status-cancelled' && (
                          <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                        )}
                      </DropdownMenuItem>
                    )}
                  </>
                )
              })()}
              
              {/* Show current status */}
              {workOrder.status && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    <span className="text-neutral-500 text-xs">
                      目前狀態：{WORK_ORDER_STATUS_LABELS[workOrder.status]}
                    </span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {/* Material Readiness Toggles */}
        <DropdownMenuItem
          onClick={async (e) => {
            e.stopPropagation()
            await handleAction(
              'toggle-production-materials',
              () => handleToggle('productionMaterialsReady', workOrder.productionMaterialsReady),
              '' // Message returned from handleToggle
            )
          }}
          disabled={isLoading}
          className="h-12 lg:h-auto"
        >
          <Package className="mr-2 h-4 w-4" />
          <span>{workOrder.productionMaterialsReady ? '取消生產物料齊' : '標記生產物料齊'}</span>
          {loadingAction === 'toggle-production-materials' && (
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={async (e) => {
            e.stopPropagation()
            await handleAction(
              'toggle-packaging-materials',
              () => handleToggle('packagingMaterialsReady', workOrder.packagingMaterialsReady),
              ''
            )
          }}
          disabled={isLoading}
          className="h-12 lg:h-auto"
        >
          <Package2 className="mr-2 h-4 w-4" />
          <span>{workOrder.packagingMaterialsReady ? '取消包裝物料齊' : '標記包裝物料齊'}</span>
          {loadingAction === 'toggle-packaging-materials' && (
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Production Status Toggle */}
        <DropdownMenuItem
          onClick={async (e) => {
            e.stopPropagation()
            await handleAction(
              'toggle-production-started',
              () => handleToggle('productionStarted', workOrder.productionStarted),
              ''
            )
          }}
          disabled={isLoading}
          className="h-12 lg:h-auto"
        >
          <Factory className="mr-2 h-4 w-4" />
          <span>{workOrder.productionStarted ? '取消已開工' : '標記已開工'}</span>
          {loadingAction === 'toggle-production-started' && (
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={async (e) => {
            e.stopPropagation()
            await handleAction(
              'toggle-completed',
              () => handleToggle('isCompleted', workOrder.isCompleted),
              ''
            )
          }}
          disabled={isLoading}
          className="h-12 lg:h-auto"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          <span>{workOrder.isCompleted ? '標記未完成' : '標記已完成'}</span>
          {loadingAction === 'toggle-completed' && (
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* VIP & Priority Toggles */}
        <DropdownMenuItem
          onClick={async (e) => {
            e.stopPropagation()
            await handleAction(
              'toggle-customer-vip',
              () => handleToggle('isCustomerServiceVip', workOrder.isCustomerServiceVip),
              ''
            )
          }}
          disabled={isLoading}
          className="h-12 lg:h-auto"
        >
          <Star className="mr-2 h-4 w-4" />
          <span>{workOrder.isCustomerServiceVip ? '取消客服VIP' : '標記客服VIP'}</span>
          {loadingAction === 'toggle-customer-vip' && (
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={async (e) => {
            e.stopPropagation()
            await handleAction(
              'toggle-boss-vip',
              () => handleToggle('isBossVip', workOrder.isBossVip),
              ''
            )
          }}
          disabled={isLoading}
          className="h-12 lg:h-auto"
        >
          <Star className="mr-2 h-4 w-4" />
          <span>{workOrder.isBossVip ? '取消老闆VIP' : '標記老闆VIP'}</span>
          {loadingAction === 'toggle-boss-vip' && (
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={async (e) => {
            e.stopPropagation()
            await handleAction(
              'toggle-urgent',
              () => handleToggle('isUrgent', workOrder.isUrgent),
              ''
            )
          }}
          disabled={isLoading}
          className="h-12 lg:h-auto"
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          <span>{workOrder.isUrgent ? '取消加急' : '標記加急'}</span>
          {loadingAction === 'toggle-urgent' && (
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Group 3: Relations (conditional) */}
        {workOrder.capsulationOrder && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/orders/${workOrder.capsulationOrder?.id}`)
            }}
            className="h-12 lg:h-auto"
          >
            <Link className="mr-2 h-4 w-4" />
            <span>查看關聯訂單</span>
          </DropdownMenuItem>
        )}

        {workOrder.capsulationOrder && <DropdownMenuSeparator />}

        {/* Group: Scheduling Table (MANAGER/ADMIN only, PRODUCTION/PRODUCTION_PACKAGING only) */}
        {(isManager || isAdmin) && 
         (workOrder.workType === WorkType.PRODUCTION || workOrder.workType === WorkType.PRODUCTION_PACKAGING) && (
          <>
            {isInScheduling === false ? (
              <DropdownMenuItem
                onClick={async (e) => {
                  e.stopPropagation()
                  await handleAddToScheduling()
                }}
                disabled={isLoading}
                className="h-12 lg:h-auto text-info-600 focus:text-info-700 focus:bg-info-50 dark:focus:bg-info-900/20"
              >
                <Calendar className="mr-2 h-4 w-4" />
                <span>加入排單表</span>
                {loadingAction === 'add-to-scheduling' && (
                  <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                )}
              </DropdownMenuItem>
            ) : isInScheduling === true ? (
              <DropdownMenuItem
                onClick={async (e) => {
                  e.stopPropagation()
                  await handleRemoveFromScheduling()
                }}
                disabled={isLoading}
                className="h-12 lg:h-auto text-neutral-600 focus:text-neutral-700 focus:bg-neutral-50 dark:focus:bg-neutral-900/20"
              >
                <CalendarX className="mr-2 h-4 w-4" />
                <span>從排單表移除</span>
                {loadingAction === 'remove-from-scheduling' && (
                  <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                )}
              </DropdownMenuItem>
            ) : null}
            
            {isInScheduling !== null && <DropdownMenuSeparator />}
          </>
        )}

        {/* Group 4: Delete */}
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onDelete(workOrder.id)
          }}
          className="text-danger-600 focus:text-danger-600 h-12 lg:h-auto"
          disabled={isLoading}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>刪除</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    {/* Link Order Modal */}
    <LinkOrderModal
      isOpen={linkModalOpen}
      onClose={() => setLinkModalOpen(false)}
      sourceType="work-order"
      sourceId={workOrder.id}
      sourceName={workOrder.jobNumber || workOrder.customerName}
      currentLink={workOrder.productionOrders && workOrder.productionOrders.length > 0 ? {
        id: workOrder.productionOrders[0].id,
        name: workOrder.productionOrders[0].productName
      } : null}
      onLinkComplete={() => {
        setLinkModalOpen(false)
        if (onRefresh) onRefresh()
      }}
    />

    {/* Unlink Confirmation Modal - Removed: unlink is now handled per-order in order detail page */}
  </>
  )
}

