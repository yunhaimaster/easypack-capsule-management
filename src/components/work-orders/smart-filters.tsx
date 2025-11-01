/**
 * Smart Filter Presets for Work Orders - REDESIGNED
 * 
 * Provides one-click filters for common workflows, based on ACTUAL workflow logic:
 * - Material ready status determined by CHECKBOX ONLY (not expected dates)
 * - No payment filters (no payment tracking in database)
 * - Production can't start without materials (removed illogical filter)
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { 
  Factory, 
  Package, 
  CheckCircle, 
  Clock, 
  Truck,
  Zap,
  Star
} from 'lucide-react'
import { WorkType, WorkOrderStatus } from '@prisma/client'

/**
 * Smart filter preset definition
 */
export interface SmartFilterPreset {
  id: string
  label: string
  description: string
  icon: React.ElementType
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  filters: {
    workTypes?: WorkType[]
    statuses?: (WorkOrderStatus | null)[]  // Include null for ongoing work
    productionStarted?: boolean
    productionMaterialsReady?: boolean
    packagingMaterialsReady?: boolean
    isUrgent?: boolean
    isVip?: boolean // Any VIP flag
    isCompleted?: boolean
  }
}

/**
 * Predefined smart filter presets - REDESIGNED FOR ACTUAL WORKFLOW
 */
export const SMART_FILTER_PRESETS: SmartFilterPreset[] = [
  // 1. All production (updated: removed status filter)
  {
    id: 'all-production',
    label: '所有生產',
    description: '包含「生產」和「生產+包裝」',
    icon: Factory,
    color: 'primary',
    filters: {
      workTypes: ['PRODUCTION', 'PRODUCTION_PACKAGING']
      // Show all, regardless of completion
    }
  },
  
  // 2. Ready to start (updated: only check materials checkbox, not status)
  {
    id: 'ready-to-start',
    label: '可以開工',
    description: '生產物料齊全，尚未開工',
    icon: CheckCircle,
    color: 'success',
    filters: {
      productionMaterialsReady: true,
      productionStarted: false,
      statuses: [null]  // Ongoing work (no status)
      // Only show PENDING orders - materials ready and not started
    }
  },
  
  // 3. Packaging ready (updated: only check materials checkbox)
  {
    id: 'packaging-ready',
    label: '等待包裝',
    description: '包裝物料齊全，可以包裝',
    icon: Package,
    color: 'success',
    filters: {
      workTypes: ['PACKAGING', 'PRODUCTION_PACKAGING'],
      packagingMaterialsReady: true,
      statuses: [null]  // Ongoing work (no status)
      // Only show PENDING orders - packaging materials ready
    }
  },
  
  // 4. Urgent orders (updated: exclude completed)
  {
    id: 'urgent-orders',
    label: '加急訂單',
    description: '客人要求加急處理（未完成）',
    icon: Zap,
    color: 'danger',
    filters: {
      isUrgent: true,
      statuses: [null]  // Ongoing work (not completed/cancelled)
    }
  },
  
  // 5. VIP customers (updated: exclude completed)
  {
    id: 'vip-customers',
    label: 'VIP客戶',
    description: '所有VIP標記的訂單（未完成）',
    icon: Star,
    color: 'info',
    filters: {
      isVip: true,
      statuses: [null]  // Ongoing work (not completed/cancelled)
    }
  },
  
  // 6. Awaiting production materials (NEW FILTER)
  {
    id: 'awaiting-production-materials',
    label: '等待生產物料',
    description: '生產物料未齊，不能開工',
    icon: Clock,
    color: 'warning',
    filters: {
      workTypes: ['PRODUCTION', 'PRODUCTION_PACKAGING'],
      productionMaterialsReady: false,
      statuses: [null]  // Ongoing work (not completed/cancelled)
    }
  },
  
  // 7. Awaiting packaging materials (NEW FILTER)
  {
    id: 'awaiting-packaging-materials',
    label: '等待包裝物料',
    description: '包裝物料未齊，不能包裝',
    icon: Clock,
    color: 'warning',
    filters: {
      workTypes: ['PACKAGING', 'PRODUCTION_PACKAGING'],
      packagingMaterialsReady: false,
      statuses: [null]  // Ongoing work (not completed/cancelled)
    }
  },
  
  // 8. In production (NEW FILTER)
  {
    id: 'in-production',
    label: '生產中',
    description: '已開始生產，未完成',
    icon: Factory,
    color: 'primary',
    filters: {
      productionStarted: true,
      isCompleted: false
    }
  },
  
  // 9. Shipped (NEW FILTER - replaces "delivery soon")
  {
    id: 'shipped',
    label: '已出貨',
    description: '已發貨給客戶',
    icon: Truck,
    color: 'success',
    filters: {
      isCompleted: true  // Only orders marked as completed (已經完成)
    }
  }
]

/**
 * REMOVED FILTERS (and why):
 * 
 * ❌ "已開工但等物料" (in-progress-waiting)
 *    Reason: Illogical - production can't start without materials
 * 
 * ❌ "等待物料" (awaiting-materials) - generic version
 *    Reason: Too vague - replaced with specific "等待生產物料" and "等待包裝物料"
 * 
 * ❌ "即將交貨" (delivery-soon) with PAID status
 *    Reason: No payment tracking exists in database, "PAID" status not meaningful
 */

interface SmartFiltersProps {
  activePreset: string | null
  onPresetSelect: (preset: SmartFilterPreset) => void
  onClearPreset: () => void
}

export function SmartFilters({ activePreset, onPresetSelect, onClearPreset }: SmartFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Text.Primary as="h4" className="font-medium text-sm sm:text-base">
          智能篩選
        </Text.Primary>
        {activePreset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearPreset}
            className="text-xs h-7"
          >
            清除篩選
          </Button>
        )}
      </div>

      <Text.Tertiary className="text-xs sm:text-sm">
        一鍵快速篩選常用條件
      </Text.Tertiary>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        {SMART_FILTER_PRESETS.map((preset) => {
          const Icon = preset.icon
          const isActive = activePreset === preset.id

          return (
            <button
              key={preset.id}
              onClick={(e) => {
                if (e.currentTarget instanceof HTMLButtonElement) {
                  e.currentTarget.blur()
                }
                onPresetSelect(preset)
              }}
              className={`
                p-3 sm:p-4 rounded-lg border-2 text-left transition-all
                ${isActive 
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600 bg-surface-primary'
                }
              `}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className={`
                  p-1.5 sm:p-2 rounded-lg flex-shrink-0
                  ${isActive
                    ? 'bg-primary-500 text-white'
                    : `bg-${preset.color}-100 dark:bg-${preset.color}-900/30 text-${preset.color}-600 dark:text-${preset.color}-400`
                  }
                `}>
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <Text.Primary className="font-medium text-xs sm:text-sm mb-0.5 sm:mb-1">
                    {preset.label}
                  </Text.Primary>
                  <Text.Tertiary className="text-[10px] sm:text-xs leading-tight">
                    {preset.description}
                  </Text.Tertiary>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
