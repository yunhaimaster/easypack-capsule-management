'use client'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Moon, Activity, Shield, Sparkles, Zap, Heart, Eye, Flower, Target, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EFFECT_CATEGORIES, categorizeEffect } from '@/lib/parse-effects'

interface EffectBadgesProps {
  effectsAnalysis: string
  maxBadges?: number
  onFilterClick?: (category: string) => void
  className?: string
}

const CATEGORY_ICONS: Record<string, any> = {
  sleep: Moon,
  digest: Activity,
  immune: Shield,
  beauty: Sparkles,
  energy: Zap,
  bone: Activity,
  cardio: Heart,
  vision: Eye,
  women: Flower,
  men: Target,
}

const CATEGORY_COLORS: Record<string, {
  bg: string
  text: string
  border: string
  hover: string
}> = {
  sleep: { bg: 'bg-info-50', text: 'text-info-700', border: 'border-info-200', hover: 'hover:bg-info-100' },
  digest: { bg: 'bg-success-50', text: 'text-success-700', border: 'border-success-200', hover: 'hover:bg-success-100' },
  immune: { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-200', hover: 'hover:bg-primary-100' },
  beauty: { bg: 'bg-info-50', text: 'text-info-700', border: 'border-info-200', hover: 'hover:bg-info-100' },
  energy: { bg: 'bg-warning-50', text: 'text-warning-700', border: 'border-warning-200', hover: 'hover:bg-warning-100' },
  bone: { bg: 'bg-neutral-50', text: 'text-neutral-700 dark:text-white/85', border: 'border-neutral-200', hover: 'hover:bg-neutral-100' },
  cardio: { bg: 'bg-danger-50', text: 'text-danger-700', border: 'border-danger-200', hover: 'hover:bg-danger-100' },
  vision: { bg: 'bg-secondary-50', text: 'text-secondary-700', border: 'border-secondary-200', hover: 'hover:bg-secondary-100' },
  women: { bg: 'bg-info-50', text: 'text-info-700', border: 'border-info-200', hover: 'hover:bg-info-100' },
  men: { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-200', hover: 'hover:bg-primary-100' },
}

export function EffectBadges({ effectsAnalysis, maxBadges = 3, onFilterClick, className }: EffectBadgesProps) {
  if (!effectsAnalysis) return null

  // Get categories for this effects analysis
  const categories = categorizeEffect(effectsAnalysis)
  
  if (categories.length === 0 || (categories.length === 1 && categories[0] === 'uncategorized')) {
    return null
  }

  // Filter out uncategorized and get display categories
  const displayCategories = categories.filter(cat => cat !== 'uncategorized')
  const visibleCategories = displayCategories.slice(0, maxBadges)
  const remainingCount = displayCategories.length - maxBadges

  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      {visibleCategories.map((categoryKey) => {
        const category = EFFECT_CATEGORIES[categoryKey as keyof typeof EFFECT_CATEGORIES]
        if (!category) return null

        const Icon = CATEGORY_ICONS[categoryKey]
        const colors = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.immune

        return (
          <TooltipProvider key={categoryKey} delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={cn(
                    "flex items-center gap-1 text-xs cursor-pointer transition-colors",
                    colors.bg,
                    colors.text,
                    colors.border,
                    colors.hover,
                    onFilterClick && "active:scale-95"
                  )}
                  onClick={(e) => {
                    if (onFilterClick) {
                      e.stopPropagation()
                      onFilterClick(categoryKey)
                    }
                  }}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  <span>{category.name}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs">
                  <p className="font-semibold mb-1">{category.name}</p>
                  <p className="text-xs text-neutral-600 dark:text-white/75">
                    點擊以篩選此類別的配方
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      })}
      
      {remainingCount > 0 && (
        <Badge 
          variant="outline" 
          className="text-xs bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-white/90 border-neutral-200 dark:border-neutral-700"
        >
          +{remainingCount}
        </Badge>
      )}
    </div>
  )
}

