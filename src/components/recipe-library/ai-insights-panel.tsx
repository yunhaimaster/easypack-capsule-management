'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Lightbulb, Copy, Check, Clock, RefreshCw } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/toast-provider'
import type { RecipeLibraryItem } from '@/types'
import { formatDate } from '@/lib/date-utils'

interface AIInsightsPanelProps {
  recipe: RecipeLibraryItem
}

export function AIInsightsPanel({ recipe }: AIInsightsPanelProps) {
  const { showToast } = useToast()
  const [suggestions, setSuggestions] = useState<any[]>([])
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
            setProgressMessage('AI 正在分析配方...')
          } else if (newTime < 60) {
            setProgressMessage('AI 正在生成優化建議...')
          } else if (newTime < 90) {
            setProgressMessage('AI 正在完善分析結果...')
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

  // 🆕 自動加載已保存的 AI 建議
  useEffect(() => {
    if (recipe.aiSuggestions && !analyzed) {
      try {
        const savedSuggestions = JSON.parse(recipe.aiSuggestions)
        if (Array.isArray(savedSuggestions) && savedSuggestions.length > 0) {
          setSuggestions(savedSuggestions)
          setAnalyzed(true)
        }
      } catch (error) {
        console.error('[AIInsightsPanel] Parse saved suggestions error:', error)
        // 解析失敗時清除無效數據（可選）
      }
    }
  }, [recipe.aiSuggestions, analyzed])

  const analyzeSuggestions = async () => {
    setLoading(true)
    setElapsedTime(0)
    setProgressMessage('正在連接 AI 服務...')
    
    try {
      // Create AbortController for client-side timeout handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 130000) // 2 minutes + 10 seconds buffer

      const response = await fetch('/api/recipes/suggest-alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recipeId: recipe.id,
          ingredients: recipe.ingredients 
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      const data = await response.json()
      
      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions)
        setAnalyzed(true)
        showToast({
          title: '分析完成',
          description: `已生成 ${data.suggestions.length} 個優化建議`
        })
      } else {
        throw new Error(data.error || '分析失敗')
      }
    } catch (error) {
      console.error('Suggestions error:', error)
      
      if (error instanceof Error && error.name === 'AbortError') {
        showToast({
          title: '分析超時',
          description: 'AI 分析時間過長，請稍後再試',
          variant: 'destructive'
        })
      } else {
        showToast({
          title: '分析失敗',
          description: error instanceof Error ? error.message : '無法獲取優化建議，請重試',
          variant: 'destructive'
        })
      }
    } finally {
      setLoading(false)
      setElapsedTime(0)
      setProgressMessage('')
    }
  }

  const handleCopyAll = () => {
    if (!suggestions || suggestions.length === 0) return
    
    // Format all suggestions as text
    const textContent = suggestions.map((suggestion, index) => {
      const priority = suggestion.priority === 'high' ? '高優先級' : suggestion.priority === 'medium' ? '中優先級' : '低優先級'
      return `${index + 1}. ${suggestion.title} [${priority}]\n${suggestion.description}\n預期效果：${suggestion.impact}\n`
    }).join('\n---\n\n')
    
    navigator.clipboard.writeText(textContent).then(() => {
      setCopied(true)
      showToast({
        title: '已複製',
        description: '所有優化建議已複製到剪貼簿'
      })
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      showToast({
        title: '複製失敗',
        description: '無法複製內容',
        variant: 'destructive'
      })
    })
  }

  return (
    <Card className="liquid-glass-card liquid-glass-card-elevated">
      <div className="liquid-glass-content">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-white/95">AI 優化建議</h2>
            {/* 🆕 顯示分析時間 */}
            {analyzed && recipe.aiSuggestionsAt && (
              <span className="text-xs text-neutral-500 dark:text-white/65">
                ({formatDate(recipe.aiSuggestionsAt)})
              </span>
            )}
          </div>
          {analyzed && suggestions.length > 0 && (
            <div className="flex items-center gap-2">
              {/* 🆕 重新分析按鈕 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={analyzeSuggestions}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                重新分析
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAll}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    已複製
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    複製全部
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {!analyzed ? (
          <div className="space-y-3">
            <p className="text-sm text-neutral-600 dark:text-white/75">
              AI 分析配方並提供成本優化、功效提升、原料替代和製程改善建議
            </p>
            <Button
              onClick={analyzeSuggestions}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4" />
                  開始分析
                </>
              )}
            </Button>
            
            {loading && (
              <div className="space-y-2 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary-600" />
                  <span className="text-sm font-medium text-primary-800">
                    已用時間：{Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <p className="text-xs text-primary-600">
                  {progressMessage}
                </p>
                <div className="w-full bg-primary-200 rounded-full h-1.5">
                  <div 
                    className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((elapsedTime / 120) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {suggestions.map((suggestion: any, index: number) => (
                <div 
                  key={index} 
                  className="p-4 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold text-primary-900 flex-1">
                      {index + 1}. {suggestion.title}
                    </h3>
                    {suggestion.priority && (
                      <span className={`text-xs px-2 py-0.5 rounded ml-2 shrink-0 ${
                        suggestion.priority === 'high' 
                          ? 'bg-danger-100 text-danger-700'
                          : suggestion.priority === 'medium'
                          ? 'bg-warning-100 text-warning-700'
                          : 'bg-neutral-100 text-neutral-600 dark:text-white/75'
                      }`}>
                        {suggestion.priority === 'high' ? '高' : suggestion.priority === 'medium' ? '中' : '低'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-primary-800 mb-2 whitespace-pre-wrap">
                    {suggestion.description}
                  </p>
                  {suggestion.impact && (
                    <p className="text-xs text-primary-600 bg-white/50 p-2 rounded">
                      💡 預期效果：{suggestion.impact}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </Card>
  )
}
