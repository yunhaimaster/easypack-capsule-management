'use client'

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import type { RecipeIngredient } from '@/types'
import { Package } from 'lucide-react'
import { useEffect, useState } from 'react'

interface IngredientsPopupProps {
  ingredients: RecipeIngredient[]
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export function IngredientsPopup({ ingredients, children, side = 'right' }: IngredientsPopupProps) {
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
  }, []) // Test webhook deployment

  // On mobile, render children without hover functionality
  if (isMobile) {
    return <>{children}</>
  }

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        side={side} 
        align={side === 'top' || side === 'bottom' ? 'center' : 'start'} 
        className="w-80 lg:w-96 p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="liquid-glass-card border-0 shadow-apple-xl">
          <div className="liquid-glass-content p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-neutral-200/50">
              <Package className="h-4 w-4 text-neutral-600 dark:text-white/75" />
              <h4 className="font-semibold text-neutral-800 dark:text-white/95 text-sm">
                原料清單 ({ingredients.length})
              </h4>
            </div>

            {/* Ingredients Table */}
            <div className="overflow-y-auto max-h-64 -mx-1 px-1">
              <table className="w-full text-xs">
                <thead className="sticky top-0 liquid-glass-tooltip">
                  <tr className="border-b border-neutral-200/50 dark:border-neutral-700/50">
                    <th className="text-left py-2 px-2 font-medium text-neutral-600 dark:text-neutral-400 dark:text-white/55 w-10">#</th>
                    <th className="text-left py-2 px-2 font-medium text-neutral-600 dark:text-neutral-400 dark:text-white/55">原料名稱</th>
                    <th className="text-right py-2 px-2 font-medium text-neutral-600 dark:text-neutral-400 dark:text-white/55 w-20">含量</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ingredient, index) => (
                    <tr 
                      key={index} 
                      className="border-b border-neutral-100/50 dark:border-neutral-800/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="py-2 px-2 text-neutral-500 dark:text-neutral-400 dark:text-white/55 text-center">
                        {index + 1}
                      </td>
                      <td className="py-2 px-2 text-neutral-800 dark:text-white/95">
                        {ingredient.materialName || '-'}
                      </td>
                      <td className="py-2 px-2 text-right text-neutral-600 dark:text-neutral-400 dark:text-white/55 font-mono">
                        {(ingredient.unitContentMg ?? 0).toLocaleString()} mg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer - Total */}
            <div className="mt-3 pt-3 border-t border-neutral-200/50 flex justify-between items-center text-xs">
              <span className="text-neutral-600 dark:text-white/75">總含量</span>
              <span className="font-semibold text-neutral-800 dark:text-white/95 font-mono">
                {ingredients.reduce((sum, ing) => sum + (ing.unitContentMg ?? 0), 0).toLocaleString()} mg
              </span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

