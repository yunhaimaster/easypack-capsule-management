'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, Loader2, Copy, Check } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'
import type { RecipeIngredient } from '@/types'

interface IngredientWarningsProps {
  ingredients: RecipeIngredient[]
  recipeId: string
}

interface IngredientWarning {
  ingredient1: string
  ingredient2: string
  severity: 'high' | 'medium' | 'low'
  warning: string
  recommendation: string
}

export function IngredientWarnings({ ingredients, recipeId }: IngredientWarningsProps) {
  const { showToast } = useToast()
  const [warnings, setWarnings] = useState<IngredientWarning[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [copied, setCopied] = useState(false)

  const analyzeInteractions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/recipes/analyze-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId,
          ingredients: ingredients.map(ing => ({
            materialName: ing.materialName,
            unitContentMg: ing.unitContentMg
          }))
        })
      })

      const result = await response.json()
      if (result.success) {
        setWarnings(result.data.warnings || [])
        setAnalyzed(true)
      }
    } catch (error) {
      console.error('Analyze interactions error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyAllWarnings = () => {
    if (warnings.length === 0) return

    const formattedText = warnings.map((w, index) => `
${index + 1}. ${w.ingredient1} + ${w.ingredient2} [${w.severity === 'high' ? '高風險' : w.severity === 'medium' ? '中風險' : '低風險'}]
⚠️ ${w.warning}
💡 建議：${w.recommendation}
    `).join('\n---\n')

    navigator.clipboard.writeText(formattedText.trim())
      .then(() => {
        setCopied(true)
        showToast({ title: '複製成功', description: '相互作用分析已複製到剪貼板' })
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(err => {
        console.error('Failed to copy:', err)
        showToast({ title: '複製失敗', description: '無法複製分析結果', variant: 'destructive' })
      })
  }

  if (!analyzed) {
    return (
      <Card className="liquid-glass-card">
        <div className="liquid-glass-content">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-800 mb-1">
                原料相互作用分析
              </h3>
              <p className="text-xs text-neutral-600">
                AI 分析原料之間的潛在相互作用和風險
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={analyzeInteractions}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              分析
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (warnings.length === 0) {
    return (
      <Card className="liquid-glass-card border-success-200">
        <div className="liquid-glass-content">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-success-600" />
            <div>
              <h3 className="text-sm font-semibold text-success-800">
                無相互作用警告
              </h3>
              <p className="text-xs text-success-600">
                所有原料組合安全，未發現顯著的相互作用風險
              </p>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="liquid-glass-card border-warning-200">
      <div className="liquid-glass-content">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning-600" />
            <h3 className="text-sm font-semibold text-warning-800">
              發現 {warnings.length} 個潛在相互作用
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyAllWarnings}
            className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            複製全部
          </Button>
        </div>
        <div className="space-y-3">
          {warnings.map((warning, index) => (
            <div
              key={index}
              className="p-3 bg-white border border-neutral-200 rounded-lg"
            >
              <div className="flex items-start gap-2 mb-2">
                <Badge
                  variant={
                    warning.severity === 'high'
                      ? 'destructive'
                      : warning.severity === 'medium'
                      ? 'default'
                      : 'secondary'
                  }
                  className="text-xs"
                >
                  {warning.severity === 'high'
                    ? '高風險'
                    : warning.severity === 'medium'
                    ? '中風險'
                    : '低風險'}
                </Badge>
                <div className="flex-1">
                  <p className="text-xs font-medium text-neutral-800">
                    {warning.ingredient1} + {warning.ingredient2}
                  </p>
                </div>
              </div>
              <p className="text-xs text-neutral-600 mb-2">{warning.warning}</p>
              <p className="text-xs text-primary-600 bg-primary-50 p-2 rounded">
                💡 {warning.recommendation}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

