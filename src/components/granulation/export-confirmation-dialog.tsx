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
            <Brain className="h-5 w-5 text-purple-600" />
            <h3 className="text-sm font-semibold text-neutral-800">訂單資訊</h3>
          </div>
          
          <div className="bg-blue-50/50 border border-blue-200/60 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-neutral-600 mb-1">客戶名稱</p>
                <p className="text-sm font-medium text-neutral-900">{order.customerName}</p>
              </div>
              <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                訂單 #{order.id.slice(0, 8)}
              </Badge>
            </div>
            
            <div>
              <p className="text-xs text-neutral-600 mb-1">產品名稱</p>
              <p className="text-sm font-medium text-neutral-900">{order.productName}</p>
            </div>
          </div>
        </div>

        {/* 配方原料清單 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-800">配方原料</h3>
            <Badge 
              className={hasIngredients 
                ? "bg-emerald-100 text-emerald-700 border-emerald-300" 
                : "bg-danger-100 text-danger-700 border-red-300"
              }
            >
              {ingredientCount} 項原料
            </Badge>
          </div>

          {hasIngredients ? (
            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-600">原料名稱</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-neutral-600">單粒含量</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.ingredients.map((ingredient, index) => (
                    <tr key={ingredient.id || index} className="hover:bg-neutral-50/50">
                      <td className="px-4 py-2.5 text-neutral-800">{ingredient.materialName}</td>
                      <td className="px-4 py-2.5 text-right text-neutral-700 font-mono">
                        {formatNumber(ingredient.unitContentMg)} mg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-danger-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-danger-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-danger-800">無法匯出配方</p>
                <p className="text-xs text-danger-700 mt-1">該訂單目前沒有配方原料資料。</p>
              </div>
            </div>
          )}
        </div>

        {/* 說明資訊 */}
        {hasIngredients && (
          <div className="bg-purple-50/50 border border-purple-200/60 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-purple-900">
                  將匯出至製粒分析頁面
                </p>
                <p className="text-xs text-purple-800 leading-relaxed">
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
            className="ripple-effect btn-micro-hover bg-purple-600 hover:bg-purple-700"
          >
            <Brain className="mr-2 h-4 w-4" />
            確認匯出
          </Button>
        </div>
      </div>
    </LiquidGlassModal>
  )
}
