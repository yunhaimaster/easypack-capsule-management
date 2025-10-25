/**
 * Smart Filter Presets for Work Orders
 * 
 * Provides one-click filters for common workflows:
 * - All production work (生產 + 生產+包裝)
 * - Ready to start (materials ready but production not started)
 * - Awaiting materials (production started but materials not ready)
 * - etc.
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
  AlertCircle,
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
    statuses?: WorkOrderStatus[]
    productionStarted?: boolean
    productionMaterialsReady?: boolean
    packagingMaterialsReady?: boolean
    isUrgent?: boolean
    isVip?: boolean // Any VIP flag
    isCompleted?: boolean
  }
}

/**
 * Predefined smart filter presets
 */
export const SMART_FILTER_PRESETS: SmartFilterPreset[] = [
  {
    id: 'all-production',
    label: '所有生產',
    description: '包含「生產」和「生產+包裝」',
    icon: Factory,
    color: 'primary',
    filters: {
      workTypes: ['PRODUCTION', 'PRODUCTION_PACKAGING']
    }
  },
  {
    id: 'ready-to-start',
    label: '可以開工',
    description: '物料齊全，但未開始生產',
    icon: CheckCircle,
    color: 'success',
    filters: {
      productionMaterialsReady: true,
      productionStarted: false,
      statuses: ['PENDING', 'DATA_COMPLETE']
    }
  },
  {
    id: 'in-progress-waiting',
    label: '已開工但等物料',
    description: '生產已開始，但物料未齊',
    icon: AlertCircle,
    color: 'warning',
    filters: {
      productionStarted: true,
      productionMaterialsReady: false,
      statuses: ['DATA_COMPLETE', 'NOTIFIED']
    }
  },
  {
    id: 'urgent-orders',
    label: '加急訂單',
    description: '客人要求加急處理',
    icon: Zap,
    color: 'danger',
    filters: {
      isUrgent: true,
      statuses: ['PENDING', 'DATA_COMPLETE', 'NOTIFIED']
    }
  },
  {
    id: 'vip-customers',
    label: 'VIP客戶',
    description: '所有VIP標記的訂單',
    icon: Star,
    color: 'info',
    filters: {
      isVip: true
    }
  },
  {
    id: 'packaging-ready',
    label: '等待包裝',
    description: '包裝物料齊，可以包裝',
    icon: Package,
    color: 'success',
    filters: {
      workTypes: ['PACKAGING', 'PRODUCTION_PACKAGING'],
      packagingMaterialsReady: true,
      statuses: ['DATA_COMPLETE', 'NOTIFIED', 'PENDING']
    }
  },
  {
    id: 'awaiting-materials',
    label: '等待物料',
    description: '所有物料未齊的訂單',
    icon: Clock,
    color: 'neutral',
    filters: {
      productionMaterialsReady: false,
      statuses: ['PENDING', 'DATA_COMPLETE']
    }
  },
  {
    id: 'delivery-soon',
    label: '即將交貨',
    description: '已完成或接近交貨期',
    icon: Truck,
    color: 'info',
    filters: {
      statuses: ['COMPLETED', 'SHIPPED']
    }
  }
]

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {SMART_FILTER_PRESETS.map((preset) => {
          const Icon = preset.icon
          const isActive = activePreset === preset.id

          return (
            <button
              key={preset.id}
              onClick={() => onPresetSelect(preset)}
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

