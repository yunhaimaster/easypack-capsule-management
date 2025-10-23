'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Eye,
  Edit,
  Brain,
  TrendingUp,
  ShoppingCart,
  Download,
  Trash2,
  MoreVertical,
  RotateCcw,
  FlaskConical
} from 'lucide-react'
import type { RecipeLibraryItem } from '@/types'

interface RecipeActionsMenuProps {
  recipe: RecipeLibraryItem
  onView: (id: string) => void
  onEdit?: (id: string) => void
  onAnalyzeEffects?: (id: string) => void
  onMarketingAnalysis?: (id: string) => void
  onGranulationAnalysis?: (id: string) => void // 🆕 製粒分析
  onCreateOrder?: (id: string) => void
  onExport?: (id: string) => void
  onDelete?: (id: string) => void
  analysisStatus?: 'analyzed' | 'analyzing' | 'failed' | 'not-analyzed'
}

export function RecipeActionsMenu({
  recipe,
  onView,
  onEdit,
  onAnalyzeEffects,
  onMarketingAnalysis,
  onGranulationAnalysis,
  onCreateOrder,
  onExport,
  onDelete,
  analysisStatus
}: RecipeActionsMenuProps) {
  const isTemplate = recipe.recipeType === 'template'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-neutral-100"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">打開選單</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* View */}
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onView(recipe.id)
          }}
          className="cursor-pointer"
        >
          <Eye className="h-4 w-4 mr-2" />
          查看詳情
        </DropdownMenuItem>

        {/* Edit (templates only) */}
        {isTemplate && onEdit && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onEdit(recipe.id)
            }}
            className="cursor-pointer"
          >
            <Edit className="h-4 w-4 mr-2" />
            編輯配方
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Analyze / Re-analyze */}
        {onAnalyzeEffects && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onAnalyzeEffects(recipe.id)
            }}
            className="cursor-pointer"
            disabled={analysisStatus === 'analyzing'}
          >
            {analysisStatus === 'analyzed' ? (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                重新分析
              </>
            ) : analysisStatus === 'failed' ? (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                重試分析
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                分析功效
              </>
            )}
          </DropdownMenuItem>
        )}

        {/* Marketing Analysis (all recipes) */}
        {onMarketingAnalysis && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onMarketingAnalysis(recipe.id)
            }}
            className="cursor-pointer text-warning-600 focus:text-warning-700"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            行銷分析
          </DropdownMenuItem>
        )}

        {/* Granulation Analysis */}
        {onGranulationAnalysis && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onGranulationAnalysis(recipe.id)
            }}
            className="cursor-pointer text-purple-600 focus:text-purple-700"
          >
            <FlaskConical className="h-4 w-4 mr-2" />
            製粒分析
          </DropdownMenuItem>
        )}

        {/* Create Order (production only) */}
        {!isTemplate && onCreateOrder && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onCreateOrder(recipe.id)
            }}
            className="cursor-pointer"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            創建訂單
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Export */}
        {onExport && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onExport(recipe.id)
            }}
            className="cursor-pointer"
          >
            <Download className="h-4 w-4 mr-2" />
            導出為 Excel
          </DropdownMenuItem>
        )}

        {/* Delete */}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onDelete(recipe.id)
              }}
              className="cursor-pointer text-danger-600 focus:text-danger-600 focus:bg-danger-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              刪除配方
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

