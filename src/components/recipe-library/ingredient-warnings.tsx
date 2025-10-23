'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, Loader2, Copy, Check, Clock, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'
import type { RecipeLibraryItem } from '@/types'
import { formatDate } from '@/lib/date-utils'

interface IngredientWarningsProps {
  recipe: RecipeLibraryItem  // 🆕 改為接收完整配方對象
}

interface IngredientWarning {
  ingredient1: string
  ingredient2: string
  severity: 'high' | 'medium' | 'low'
  warning: string
  recommendation: string
}

export function IngredientWarnings({ recipe }: IngredientWarningsProps) {
  // 從 recipe 中提取需要的數據
  const { ingredients, id: recipeId } = recipe
  const { showToast } = useToast()
  const [warnings, setWarnings] = useState<IngredientWarning[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')

  // Progress tracking effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (loading) {
      setElapsedTime(0)
      interval = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1
          // Update progress message based on elapsed time
          if (newTime < 10) {
            setProgressMessage('正在連接 AI 服務...')
          } else if (newTime < 30) {
            setProgressMessage('AI 正在分析原料相互作用...')
          } else if (newTime < 60) {
            setProgressMessage('AI 正在檢查潛在風險...')
          } else if (newTime < 90) {
            setProgressMessage('AI 正在生成安全建議...')
          } else {
            setProgressMessage('AI 分析時間較長，請稍候...')
          }
          return newTime
        })
      }, 1000)
    } else {
      setProgressMessage('')
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [loading])

  // 🆕 自動加載已保存的相互作用分析
  useEffect(() => {
    if (recipe.aiInteractions && !analyzed) {
      try {
        const savedWarnings = JSON.parse(recipe.aiInteractions)
        if (Array.isArray(savedWarnings)) {
          setWarnings(savedWarnings)
          setAnalyzed(true)
        }
      } catch (error) {
        console.error('[IngredientWarnings] Parse saved interactions error:', error)
      }
    }
  }, [recipe.aiInteractions, analyzed])

  const analyzeInteractions = async () => {
    setLoading(true)
    setElapsedTime(0)
    setProgressMessage('正在連接 AI 服務...')
    
    try {
      // Create AbortController for client-side timeout handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 130000) // 2 minutes + 10 seconds buffer

      const response = await fetch('/api/recipes/analyze-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId,
          ingredients: ingredients.map(ing => ({
            materialName: ing.materialName,
            unitContentMg: ing.unitContentMg
          }))
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const result = await response.json()
      
      if (result.success) {
        setWarnings(result.data.warnings || [])
        setAnalyzed(true)
        showToast({
          title: '分析完成',
          description: result.data.warnings?.length > 0 
            ? `發現 ${result.data.warnings.length} 個潛在相互作用`
            : '未發現顯著的原料相互作用'
        })
      } else {
        throw new Error(result.error || '分析失敗')
      }
    } catch (error) {
      console.error('Analyze interactions error:', error)
      
      if (error instanceof Error && error.name === 'AbortError') {
        showToast({
          title: '分析超時',
          description: 'AI 分析時間過長，請稍後再試',
          variant: 'destructive'
        })
      } else {
        showToast({
          title: '分析失敗',
          description: error instanceof Error ? error.message : '無法分析原料相互作用，請重試',
          variant: 'destructive'
        })
      }
    } finally {
      setLoading(false)
      setElapsedTime(0)
      setProgressMessage('')
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
              <h3 className="text-sm font-semibold text-neutral-800 mb-1 flex items-center gap-2">
                原料相互作用分析
                {/* 🆕 顯示分析時間 */}
                {recipe.aiInteractionsAt && (
                  <span className="text-xs text-neutral-500 font-normal">
                    (上次: {formatDate(recipe.aiInteractionsAt)})
                  </span>
                )}
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
          
          {loading && (
            <div className="mt-3 space-y-2 p-3 bg-warning-50 border border-warning-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning-600" />
                <span className="text-sm font-medium text-warning-800">
                  已用時間：{Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <p className="text-xs text-warning-600">
                {progressMessage}
              </p>
              <div className="w-full bg-warning-200 rounded-full h-1.5">
                <div 
                  className="bg-warning-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((elapsedTime / 120) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
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
            {/* 🆕 顯示分析時間 */}
            {recipe.aiInteractionsAt && (
              <span className="text-xs text-neutral-500">
                ({formatDate(recipe.aiInteractionsAt)})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* 🆕 重新分析按鈕 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={analyzeInteractions}
              disabled={loading}
              className="flex items-center gap-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
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

