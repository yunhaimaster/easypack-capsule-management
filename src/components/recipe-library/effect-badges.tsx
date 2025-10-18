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
  sleep: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', hover: 'hover:bg-purple-100' },
  digest: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', hover: 'hover:bg-green-100' },
  immune: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', hover: 'hover:bg-blue-100' },
  beauty: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', hover: 'hover:bg-pink-100' },
  energy: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', hover: 'hover:bg-orange-100' },
  bone: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', hover: 'hover:bg-gray-100' },
  cardio: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', hover: 'hover:bg-red-100' },
  vision: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', hover: 'hover:bg-cyan-100' },
  women: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', hover: 'hover:bg-rose-100' },
  men: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', hover: 'hover:bg-indigo-100' },
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
                  <p className="text-xs text-neutral-600">
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
          className="text-xs bg-neutral-50 text-neutral-600 border-neutral-200"
        >
          +{remainingCount}
        </Badge>
      )}
    </div>
  )
}

