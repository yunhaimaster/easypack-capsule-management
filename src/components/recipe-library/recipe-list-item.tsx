'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconContainer } from '@/components/ui/icon-container'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Beaker, Sparkles, Eye, Edit, Package, Brain } from 'lucide-react'
import type { RecipeLibraryItem } from '@/types'
import { cn } from '@/lib/utils'
import { getEffectsSummary } from '@/lib/parse-effects'
import { AnalysisStatusBadge } from './analysis-status-badge'
import { EffectBadges } from './effect-badges'
import { RecipeActionsMenu } from './recipe-actions-menu'
import { IngredientsPopup } from './ingredients-popup'

interface RecipeListItemProps {
  recipe: RecipeLibraryItem
  onView: (id: string) => void
  onEdit?: (id: string) => void
  onCreateOrder?: (id: string) => void
  onMarketingAnalysis?: (id: string) => void
  onGranulationAnalysis?: (id: string) => void // 🆕 製粒分析
  onAnalyzeEffects?: (id: string) => void
  analysisStatus?: 'analyzed' | 'analyzing' | 'failed' | 'not-analyzed'
  onEffectFilterClick?: (category: string) => void
  onExport?: (id: string) => void
  onDelete?: (id: string) => void
}

export function RecipeListItem({ recipe, onView, onEdit, onCreateOrder, onMarketingAnalysis, onGranulationAnalysis, onAnalyzeEffects, analysisStatus, onEffectFilterClick, onExport, onDelete }: RecipeListItemProps) {
  const isTemplate = recipe.recipeType === 'template'
  
  return (
    <IngredientsPopup ingredients={recipe.ingredients} side="top">
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
          
          {/* 配方名稱 + 狀態 */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <h3 className="font-semibold text-neutral-800 truncate text-sm lg:text-base">
              {recipe.recipeName}
            </h3>
            {analysisStatus && (
              <AnalysisStatusBadge 
                status={analysisStatus}
                onRetry={analysisStatus === 'failed' && onAnalyzeEffects ? () => onAnalyzeEffects(recipe.id) : undefined}
                className="shrink-0"
              />
            )}
          </div>
          
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
            
            {/* Show analyze button if recipe has no effects analysis */}
            {!recipe.aiEffectsAnalysis && onAnalyzeEffects && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onAnalyzeEffects(recipe.id)
                }}
                className="flex items-center gap-1.5 h-8 text-xs bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              >
                <Brain className="h-3.5 w-3.5" />
                <span>分析功效</span>
              </Button>
            )}
            
            {/* Actions Menu */}
            <RecipeActionsMenu
              recipe={recipe}
              onView={onView}
              onEdit={onEdit}
              onAnalyzeEffects={onAnalyzeEffects}
              onMarketingAnalysis={onMarketingAnalysis}
              onGranulationAnalysis={onGranulationAnalysis}
              onCreateOrder={onCreateOrder}
              onExport={onExport}
              onDelete={onDelete}
              analysisStatus={analysisStatus}
            />
          </div>
          
          {/* 操作按鈕 - 移動版（僅圖標） */}
          <div className="flex lg:hidden items-center gap-1.5 shrink-0">
            {!recipe.aiEffectsAnalysis && onAnalyzeEffects && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onAnalyzeEffects(recipe.id)
                }}
                className="h-8 w-8 p-0 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              >
                <Brain className="h-4 w-4" />
              </Button>
            )}
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
            
            {/* Quick Actions Menu for Mobile */}
            <RecipeActionsMenu
              recipe={recipe}
              onView={onView}
              onEdit={onEdit}
              onAnalyzeEffects={onAnalyzeEffects}
              onMarketingAnalysis={onMarketingAnalysis}
              onGranulationAnalysis={onGranulationAnalysis}
              onCreateOrder={onCreateOrder}
              onExport={onExport}
              onDelete={onDelete}
              analysisStatus={analysisStatus}
            />
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
          
          {/* 效果標籤 - 視覺化分類顯示 */}
          {recipe.aiEffectsAnalysis && (
            <>
              <span className="hidden sm:inline text-neutral-400">·</span>
              <EffectBadges 
                effectsAnalysis={recipe.aiEffectsAnalysis}
                maxBadges={3}
                onFilterClick={onEffectFilterClick}
              />
            </>
          )}
        </div>
        </div>
      </div>
    </IngredientsPopup>
  )
}

