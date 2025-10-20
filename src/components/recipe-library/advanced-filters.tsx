'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, SlidersHorizontal } from 'lucide-react'
import { EFFECT_CATEGORIES, CATEGORY_GROUPS, getGroupedCategories } from '@/lib/parse-effects'

interface AdvancedFiltersProps {
  selectedEffects: string[]
  onEffectToggle: (effect: string) => void
  sortBy: 'newest' | 'oldest' | 'name' | 'usage' | 'ingredients'
  onSortChange: (sort: 'newest' | 'oldest' | 'name' | 'usage' | 'ingredients') => void
  onClearAll: () => void
  className?: string
}

export function AdvancedFilters({
  selectedEffects,
  onEffectToggle,
  sortBy,
  onSortChange,
  onClearAll,
  className
}: AdvancedFiltersProps) {
  const hasActiveFilters = selectedEffects.length > 0

  return (
    <Card className="liquid-glass-card">
      <div className="liquid-glass-content p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-neutral-600" />
            <h3 className="font-semibold text-sm text-neutral-800">進階篩選</h3>
          </div>
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearAll}
              className="h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              清除全部
            </Button>
          )}
        </div>

        {/* Sort */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-neutral-700">排序方式</label>
          <Select value={sortBy} onValueChange={(v: any) => onSortChange(v)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">最新優先</SelectItem>
              <SelectItem value="oldest">最舊優先</SelectItem>
              <SelectItem value="name">名稱排序</SelectItem>
              <SelectItem value="usage">使用次數</SelectItem>
              <SelectItem value="ingredients">原料數量</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Effect Categories - Grouped */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-neutral-700">
            功效類別 {selectedEffects.length > 0 && `(${selectedEffects.length})`}
          </label>
          
          {/* Render groups */}
          {Object.entries(CATEGORY_GROUPS)
            .sort((a, b) => a[1].order - b[1].order)
            .map(([groupKey, groupInfo]) => {
              const groupCategories = Object.entries(EFFECT_CATEGORIES).filter(
                ([_, cat]) => cat.group === groupKey
              )
              
              if (groupCategories.length === 0) return null
              
              return (
                <div key={groupKey} className="space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wide text-neutral-500 font-semibold">
                    {groupInfo.name}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {groupCategories.map(([key, category]) => {
                      const isSelected = selectedEffects.includes(key)
                      return (
                        <Badge
                          key={key}
                          variant={isSelected ? 'default' : 'outline'}
                          className={`cursor-pointer transition-all text-xs ${
                            isSelected 
                              ? 'bg-primary-600 hover:bg-primary-700' 
                              : 'hover:bg-neutral-100'
                          }`}
                          onClick={() => onEffectToggle(key)}
                        >
                          {category.name}
                          {isSelected && <X className="h-3 w-3 ml-1" />}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )
            })}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-2 border-t text-xs text-neutral-600">
            已選擇 {selectedEffects.length} 個類別
          </div>
        )}
      </div>
    </Card>
  )
}

