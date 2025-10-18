'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Lightbulb } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { RecipeLibraryItem } from '@/types'

interface AIInsightsPanelProps {
  recipe: RecipeLibraryItem
}

export function AIInsightsPanel({ recipe }: AIInsightsPanelProps) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)

  const analyzeSuggestions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/recipes/suggest-alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recipeId: recipe.id,
          ingredients: recipe.ingredients 
        })
      })
      const data = await response.json()
      
      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions)
        setAnalyzed(true)
      }
    } catch (error) {
      console.error('Suggestions error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="liquid-glass-card liquid-glass-card-elevated">
      <div className="liquid-glass-content">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-neutral-800">AI 優化建議</h2>
        </div>

        {!analyzed ? (
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">
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
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="space-y-3 pr-3">
              {suggestions.map((suggestion: any, index: number) => (
                <div 
                  key={index} 
                  className="p-3 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold text-primary-900">
                      {index + 1}. {suggestion.title}
                    </h3>
                    {suggestion.priority && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        suggestion.priority === 'high' 
                          ? 'bg-danger-100 text-danger-700'
                          : suggestion.priority === 'medium'
                          ? 'bg-warning-100 text-warning-700'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {suggestion.priority === 'high' ? '高' : suggestion.priority === 'medium' ? '中' : '低'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-primary-800 mb-2">
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
