'use client'

import { ProductionOrder } from '@/types'
import { Button } from '@/components/ui/button'
import { LiquidGlassModal } from '@/components/ui/liquid-glass-modal'
import { Badge } from '@/components/ui/badge'
import { Brain, CheckCircle, AlertCircle } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

interface ExportConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  order: ProductionOrder
}

export function ExportConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  order
}: ExportConfirmationDialogProps) {
  const ingredientCount = order.ingredients?.length || 0
  const hasIngredients = ingredientCount > 0

  return (
    <LiquidGlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="匯出配方至製粒分析"
      size="lg"
      zIndex={11000}
    >
      <div className="space-y-6">
        {/* 訂單基本資訊 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-info-600 dark:text-info-400" />
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">訂單資訊</h3>
          </div>
          
          <div className="bg-primary-50/50 dark:bg-primary-900/20 border border-primary-200/60 dark:border-primary-700/40 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">客戶名稱</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{order.customerName}</p>
              </div>
              <Badge className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 border-primary-300 dark:border-primary-700">
                訂單 #{order.id.slice(0, 8)}
              </Badge>
            </div>
            
            <div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">產品名稱</p>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{order.productName}</p>
            </div>
          </div>
        </div>

        {/* 配方原料清單 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">配方原料</h3>
            <Badge 
              className={hasIngredients 
                ? "bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-200 border-success-300 dark:border-success-700" 
                : "bg-danger-100 dark:bg-danger-900 text-danger-700 dark:text-danger-200 border-danger-300 dark:border-danger-700"
              }
            >
              {ingredientCount} 項原料
            </Badge>
          </div>

          {hasIngredients ? (
            <div className="bg-white dark:bg-surface-secondary border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400">原料名稱</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-neutral-600 dark:text-neutral-400">單粒含量</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                  {order.ingredients.map((ingredient, index) => (
                    <tr key={ingredient.id || index} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                      <td className="px-4 py-2.5 text-neutral-800 dark:text-neutral-200">{ingredient.materialName}</td>
                      <td className="px-4 py-2.5 text-right text-neutral-700 dark:text-neutral-300 font-mono">
                        {formatNumber(ingredient.unitContentMg)} mg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700/40 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-danger-600 dark:text-danger-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-danger-800 dark:text-danger-200">無法匯出配方</p>
                <p className="text-xs text-danger-700 dark:text-danger-300 mt-1">該訂單目前沒有配方原料資料。</p>
              </div>
            </div>
          )}
        </div>

        {/* 說明資訊 */}
        {hasIngredients && (
          <div className="bg-info-50/50 dark:bg-info-900/20 border border-info-200/60 dark:border-info-700/40 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-info-600 dark:text-info-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-info-900 dark:text-info-100">
                  將匯出至製粒分析頁面
                </p>
                <p className="text-xs text-info-800 dark:text-info-200 leading-relaxed">
                  點擊確認後，系統會將此訂單的配方原料自動填入製粒分析頁面，
                  您可以使用 3 個專業 AI 模型（DeepSeek V3.1 Terminus、GPT-4.1 Mini、Grok 4 Fast）
                  進行深入的製粒必要性分析。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 操作按鈕 */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="ripple-effect btn-micro-hover"
          >
            取消
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!hasIngredients}
            className="ripple-effect btn-micro-hover bg-info-600 hover:bg-info-700 dark:bg-info-700 dark:hover:bg-info-600"
          >
            <Brain className="mr-2 h-4 w-4" />
            確認匯出
          </Button>
        </div>
      </div>
    </LiquidGlassModal>
  )
}
