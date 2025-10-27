'use client'

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { WorkOrder, WORK_ORDER_STATUS_LABELS, WORK_TYPE_LABELS } from '@/types/work-order'
import { 
  FileText, 
  User, 
  Calendar, 
  Package, 
  CheckCircle, 
  XCircle,
  Clock,
  Factory,
  Box,
  Truck,
  DollarSign,
  AlertCircle
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { zhHK } from 'date-fns/locale'

interface WorkOrderPopupProps {
  workOrder: WorkOrder
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export function WorkOrderPopup({ workOrder, children, side = 'right' }: WorkOrderPopupProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if device supports touch (mobile/tablet)
    const checkIsMobile = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isSmallScreen = window.innerWidth < 1024 // lg breakpoint
      setIsMobile(hasTouch && isSmallScreen)
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // On mobile, render children without hover functionality
  if (isMobile) {
    return <>{children}</>
  }

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return '-'
    try {
      return format(new Date(date), 'yyyy-MM-dd', { locale: zhHK })
    } catch {
      return '-'
    }
  }

  const InfoRow = ({ icon: Icon, label, value, valueClassName }: { 
    icon: any, 
    label: string, 
    value: React.ReactNode,
    valueClassName?: string 
  }) => (
    <div className="flex items-start gap-2 py-1.5">
      <Icon className="h-3.5 w-3.5 text-neutral-500 dark:text-white/65 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-neutral-500 dark:text-white/65 uppercase tracking-wide mb-0.5 font-medium">
          {label}
        </div>
        <div className={valueClassName || "text-xs text-neutral-800 dark:text-white/95 break-words"}>
          {value}
        </div>
      </div>
    </div>
  )

  const StatusIcon = ({ checked }: { checked: boolean }) => (
    checked ? (
      <CheckCircle className="h-3.5 w-3.5 text-success-600 dark:text-success-400" />
    ) : (
      <XCircle className="h-3.5 w-3.5 text-neutral-400 dark:text-white/55" />
    )
  )

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        side={side} 
        align={side === 'top' || side === 'bottom' ? 'center' : 'start'} 
        className="w-80 lg:w-[420px] p-0 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="liquid-glass-card border-0 shadow-apple-xl">
          <div className="liquid-glass-content">
            {/* Header */}
            <div className="p-4 pb-3 border-b border-neutral-200/50 dark:border-neutral-700/50">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-neutral-800 dark:text-white/95 text-base mb-1">
                    {workOrder.customerName}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-neutral-500 dark:text-white/65 font-mono">
                      {workOrder.jobNumber || '無編號'}
                    </span>
                    {workOrder.status && (
                      <Badge variant="outline" className="text-xs h-5 px-1.5">
                        {WORK_ORDER_STATUS_LABELS[workOrder.status]}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs h-5 px-1.5">
                      {WORK_TYPE_LABELS[workOrder.workType]}
                    </Badge>
                    {(workOrder.isCustomerServiceVip || workOrder.isBossVip) && (
                      <Badge variant="outline" className="text-xs h-5 px-1.5 border-primary-300 text-primary-700 dark:text-primary-400">
                        VIP
                      </Badge>
                    )}
                    {workOrder.isUrgent && (
                      <Badge variant="outline" className="text-xs h-5 px-1.5 border-danger-300 text-danger-700 dark:text-danger-400">
                        加急
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="overflow-y-auto max-h-[calc(80vh-140px)] px-4 py-3 space-y-3">
              {/* Basic Info Section */}
              <div className="space-y-1">
                <InfoRow 
                  icon={User} 
                  label="負責人" 
                  value={workOrder.personInCharge?.nickname || workOrder.personInCharge?.phoneE164 || '未指定'} 
                />
                <InfoRow 
                  icon={Calendar} 
                  label="填表日期" 
                  value={formatDate(workOrder.markedDate)} 
                />
                <InfoRow 
                  icon={FileText} 
                  label="工作描述" 
                  value={workOrder.workDescription || '-'}
                  valueClassName="text-xs text-neutral-700 dark:text-white/85 break-words whitespace-pre-wrap"
                />
              </div>

              <div className="border-t border-neutral-200/50 dark:border-neutral-700/50 my-2" />

              {/* Quantities Section */}
              <div className="space-y-1">
                <div className="text-xs text-neutral-600 dark:text-white/75 font-semibold uppercase tracking-wide mb-2">
                  數量信息
                </div>
                <InfoRow 
                  icon={Factory} 
                  label="生產數量" 
                  value={workOrder.productionQuantity 
                    ? `${workOrder.productionQuantity}${workOrder.productionQuantityStat || '個'}` 
                    : '-'
                  } 
                />
                <InfoRow 
                  icon={Package} 
                  label="包裝數量" 
                  value={workOrder.packagingQuantity 
                    ? `${workOrder.packagingQuantity}${workOrder.packagingQuantityStat || '個'}` 
                    : '-'
                  } 
                />
                {workOrder.capsulationOrder && (
                  <>
                    {workOrder.capsulationOrder.productName && (
                      <InfoRow 
                        icon={Box} 
                        label="產品名稱" 
                        value={workOrder.capsulationOrder.productName} 
                      />
                    )}
                    {workOrder.capsulationOrder.capsuleSize && (
                      <InfoRow 
                        icon={Box} 
                        label="膠囊規格" 
                        value={workOrder.capsulationOrder.capsuleSize} 
                      />
                    )}
                    {workOrder.capsulationOrder.capsuleColor && (
                      <InfoRow 
                        icon={Box} 
                        label="膠囊顏色" 
                        value={workOrder.capsulationOrder.capsuleColor} 
                      />
                    )}
                    {workOrder.capsulationOrder.capsuleType && (
                      <InfoRow 
                        icon={Box} 
                        label="膠囊類型" 
                        value={workOrder.capsulationOrder.capsuleType} 
                      />
                    )}
                  </>
                )}
              </div>

              <div className="border-t border-neutral-200/50 dark:border-neutral-700/50 my-2" />

              {/* Material Status Section */}
              <div className="space-y-1">
                <div className="text-xs text-neutral-600 dark:text-white/75 font-semibold uppercase tracking-wide mb-2">
                  物料狀態
                </div>
                <div className="flex items-center gap-2 py-1.5">
                  <StatusIcon checked={workOrder.productionMaterialsReady} />
                  <span className="text-xs text-neutral-700 dark:text-white/85">
                    生產物料{workOrder.productionMaterialsReady ? '已齊全' : '未齊全'}
                  </span>
                </div>
                <div className="flex items-center gap-2 py-1.5">
                  <StatusIcon checked={workOrder.packagingMaterialsReady} />
                  <span className="text-xs text-neutral-700 dark:text-white/85">
                    包裝物料{workOrder.packagingMaterialsReady ? '已齊全' : '未齊全'}
                  </span>
                </div>
                <div className="flex items-center gap-2 py-1.5">
                  <StatusIcon checked={workOrder.productionStarted} />
                  <span className="text-xs text-neutral-700 dark:text-white/85">
                    {workOrder.productionStarted ? '已開始生產' : '未開始生產'}
                  </span>
                </div>
              </div>

              {/* Expected Dates Section */}
              {(workOrder.expectedProductionMaterialsDate || workOrder.expectedPackagingMaterialsDate || workOrder.requestedDeliveryDate || workOrder.internalExpectedDate) && (
                <>
                  <div className="border-t border-neutral-200/50 dark:border-neutral-700/50 my-2" />
                  <div className="space-y-1">
                    <div className="text-xs text-neutral-600 dark:text-white/75 font-semibold uppercase tracking-wide mb-2">
                      預期日期
                    </div>
                    {workOrder.expectedProductionMaterialsDate && (
                      <InfoRow 
                        icon={Clock} 
                        label="生產物料預期" 
                        value={formatDate(workOrder.expectedProductionMaterialsDate)} 
                      />
                    )}
                    {workOrder.expectedPackagingMaterialsDate && (
                      <InfoRow 
                        icon={Clock} 
                        label="包裝物料預期" 
                        value={formatDate(workOrder.expectedPackagingMaterialsDate)} 
                      />
                    )}
                    {workOrder.requestedDeliveryDate && (
                      <InfoRow 
                        icon={Truck} 
                        label="要求交貨日期" 
                        value={formatDate(workOrder.requestedDeliveryDate)} 
                      />
                    )}
                    {workOrder.internalExpectedDate && (
                      <InfoRow 
                        icon={Clock} 
                        label="內部預計交貨期" 
                        value={formatDate(workOrder.internalExpectedDate)} 
                      />
                    )}
                  </div>
                </>
              )}

              {/* Additional Notes */}
              {workOrder.notes && (
                <>
                  <div className="border-t border-neutral-200/50 dark:border-neutral-700/50 my-2" />
                  <InfoRow 
                    icon={AlertCircle} 
                    label="備註" 
                    value={workOrder.notes}
                    valueClassName="text-xs text-neutral-700 dark:text-white/85 break-words whitespace-pre-wrap"
                  />
                </>
              )}

              {/* Legacy Dates (if exists) */}
              {(workOrder.notifiedDate || workOrder.paymentReceivedDate || workOrder.shippedDate) && (
                <>
                  <div className="border-t border-neutral-200/50 dark:border-neutral-700/50 my-2" />
                  <div className="space-y-1">
                    <div className="text-xs text-neutral-600 dark:text-white/75 font-semibold uppercase tracking-wide mb-2">
                      其他日期
                    </div>
                    {workOrder.notifiedDate && (
                      <InfoRow 
                        icon={Calendar} 
                        label="通知日期" 
                        value={formatDate(workOrder.notifiedDate)} 
                      />
                    )}
                    {workOrder.paymentReceivedDate && (
                      <InfoRow 
                        icon={DollarSign} 
                        label="付款日期" 
                        value={formatDate(workOrder.paymentReceivedDate)} 
                      />
                    )}
                    {workOrder.shippedDate && (
                      <InfoRow 
                        icon={Truck} 
                        label="出貨日期" 
                        value={formatDate(workOrder.shippedDate)} 
                      />
                    )}
                  </div>
                </>
              )}

              {/* Linked Order */}
              {workOrder.capsulationOrder && (
                <>
                  <div className="border-t border-neutral-200/50 dark:border-neutral-700/50 my-2" />
                  <div className="flex items-center gap-2 py-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-success-600 dark:text-success-400 shrink-0" />
                    <span className="text-xs text-neutral-700 dark:text-white/85">
                      已關聯生產訂單
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

