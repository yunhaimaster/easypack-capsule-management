'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconContainer } from '@/components/ui/icon-container'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Beaker, Sparkles, Eye, Edit, Package, ShoppingCart, TrendingUp } from 'lucide-react'
import type { RecipeLibraryItem } from '@/types'
import { cn } from '@/lib/utils'
import { getEffectsSummary } from '@/lib/parse-effects'

interface RecipeListItemProps {
  recipe: RecipeLibraryItem
  onView: (id: string) => void
  onEdit?: (id: string) => void
  onCreateOrder?: (id: string) => void
  onMarketingAnalysis?: (id: string) => void
}

export function RecipeListItem({ recipe, onView, onEdit, onCreateOrder, onMarketingAnalysis }: RecipeListItemProps) {
  const isTemplate = recipe.recipeType === 'template'
  
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-apple-md bg-white/80 backdrop-blur-sm",
        "border border-neutral-200/50 hover:border-neutral-300/70",
        "hover:shadow-apple-md transition-apple",
        "cursor-pointer",
        // 左側彩色邊框
        isTemplate ? "border-l-4 border-l-primary-500" : "border-l-4 border-l-success-500"
      )}
      onClick={() => onView(recipe.id)}
    >
      <div className="p-4">
        {/* 第一行：圖標 + 配方名稱 + 操作按鈕 */}
        <div className="flex items-center gap-3 mb-2">
          {/* 圖標 */}
          <IconContainer 
            icon={isTemplate ? Sparkles : Beaker} 
            variant={isTemplate ? 'primary' : 'success'} 
            size="sm"
            className="shrink-0"
          />
          
          {/* 配方名稱 */}
          <h3 className="flex-1 font-semibold text-neutral-800 truncate text-sm lg:text-base">
            {recipe.recipeName}
          </h3>
          
          {/* 操作按鈕 - 桌面版 */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onView(recipe.id)
              }}
              className="flex items-center gap-1.5 h-8 text-xs"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>查看</span>
            </Button>
            
            {isTemplate && onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(recipe.id)
                }}
                className="flex items-center gap-1.5 h-8 text-xs"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>編輯</span>
              </Button>
            )}
            
            {/* Template recipes: Show marketing analysis button */}
            {isTemplate && onMarketingAnalysis && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onMarketingAnalysis(recipe.id)
                }}
                className="flex items-center gap-1.5 h-8 text-xs bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>行銷分析</span>
              </Button>
            )}
            
            {/* Production recipes: Show create order button */}
            {!isTemplate && onCreateOrder && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onCreateOrder(recipe.id)
                }}
                className="flex items-center gap-1.5 h-8 text-xs bg-gradient-to-r from-primary-500 to-primary-600"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>創建訂單</span>
              </Button>
            )}
          </div>
          
          {/* 操作按鈕 - 移動版（僅圖標） */}
          <div className="flex lg:hidden items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onView(recipe.id)
              }}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* 第二行：產品名稱 + 元數據 */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-600 ml-11">
          {/* 產品名稱 */}
          <span className="font-medium truncate max-w-[200px]">
            {recipe.productName}
          </span>
          
          {/* 分隔符 */}
          <span className="hidden sm:inline text-neutral-400">·</span>
          
          {/* 原料數量 */}
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            {recipe.ingredients.length} 項原料
          </span>
          
          {/* 使用次數（僅生產配方） */}
          {!isTemplate && recipe.productionCount > 0 && (
            <>
              <span className="hidden sm:inline text-neutral-400">·</span>
              <span>使用 {recipe.productionCount} 次</span>
            </>
          )}
          
          {/* 效果標籤 - 智能解析與顯示 */}
          {recipe.aiEffectsAnalysis && (() => {
            const summary = getEffectsSummary(recipe.aiEffectsAnalysis, 50)
            
            if (summary.allEffects.length === 0) return null
            
            return (
              <>
                <span className="hidden sm:inline text-neutral-400">·</span>
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 flex-wrap cursor-pointer">
                        <Badge 
                          variant="secondary" 
                          className="bg-primary-50 text-primary-700 text-xs max-w-[280px] truncate hover:bg-primary-100 transition-colors"
                        >
                          {summary.firstEffect}
                        </Badge>
                        {summary.hasMultiple && (
                          <Badge 
                            variant="outline"
                            className="text-primary-600 border-primary-300 text-xs px-1.5 py-0 hover:bg-primary-50 transition-colors"
                          >
                            +{summary.remainingCount}
                          </Badge>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-md">
                      <div className="space-y-2">
                        <p className="font-semibold text-xs text-primary-700 mb-2">
                          功效說明（共 {summary.allEffects.length} 項）
                        </p>
                        <ol className="space-y-1.5 text-xs">
                          {summary.allEffects.map((effect, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="text-primary-600 font-medium shrink-0">{idx + 1}.</span>
                              <span className="text-neutral-700">{effect}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

