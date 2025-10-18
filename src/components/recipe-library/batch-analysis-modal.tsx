'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle, XCircle, Loader2, Brain, AlertCircle } from 'lucide-react'
import type { RecipeLibraryItem } from '@/types'

interface BatchAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  recipes: RecipeLibraryItem[]
  onComplete: () => void
}

interface AnalysisResult {
  recipeId: string
  recipeName: string
  status: 'pending' | 'analyzing' | 'success' | 'failed'
  error?: string
}

export function BatchAnalysisModal({ isOpen, onClose, recipes, onComplete }: BatchAnalysisModalProps) {
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  // Initialize results when modal opens
  useEffect(() => {
    if (isOpen && recipes.length > 0) {
      setResults(recipes.map(r => ({
        recipeId: r.id,
        recipeName: r.recipeName,
        status: 'pending'
      })))
      setCurrentIndex(0)
      setIsAnalyzing(false)
      setIsCancelled(false)
    }
  }, [isOpen, recipes])

  // Start analysis
  const startAnalysis = async () => {
    setIsAnalyzing(true)
    const controller = new AbortController()
    setAbortController(controller)

    for (let i = 0; i < recipes.length; i++) {
      if (isCancelled || controller.signal.aborted) {
        break
      }

      const recipe = recipes[i]
      setCurrentIndex(i)

      // Update status to analyzing
      setResults(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: 'analyzing' } : r
      ))

      try {
        const response = await fetch(`/api/recipes/${recipe.id}/analyze-effects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        })

        const result = await response.json()

        if (result.success) {
          setResults(prev => prev.map((r, idx) => 
            idx === i ? { ...r, status: 'success' } : r
          ))
        } else {
          setResults(prev => prev.map((r, idx) => 
            idx === i ? { ...r, status: 'failed', error: result.error } : r
          ))
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          break
        }
        setResults(prev => prev.map((r, idx) => 
          idx === i ? { ...r, status: 'failed', error: '連接失敗' } : r
        ))
      }

      // Delay between requests (1 second)
      if (i < recipes.length - 1 && !isCancelled) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    setIsAnalyzing(false)
    setAbortController(null)
    onComplete()
  }

  // Cancel analysis
  const handleCancel = () => {
    setIsCancelled(true)
    if (abortController) {
      abortController.abort()
    }
    setIsAnalyzing(false)
  }

  // Close modal
  const handleClose = () => {
    if (isAnalyzing) {
      handleCancel()
    }
    onClose()
  }

  // Calculate stats
  const completed = results.filter(r => r.status === 'success' || r.status === 'failed').length
  const successful = results.filter(r => r.status === 'success').length
  const failed = results.filter(r => r.status === 'failed').length
  const progress = recipes.length > 0 ? (completed / recipes.length) * 100 : 0
  const isComplete = completed === recipes.length && !isAnalyzing

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary-600" />
            批量分析配方功效
          </DialogTitle>
          <DialogDescription>
            {isAnalyzing 
              ? `正在分析第 ${currentIndex + 1} 個配方，共 ${recipes.length} 個`
              : isComplete
              ? '分析完成！'
              : `準備分析 ${recipes.length} 個未分析的配方`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">
                進度：{completed} / {recipes.length}
              </span>
              <span className="text-neutral-600">
                {progress.toFixed(0)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-success-600" />
                <span className="text-success-700">成功：{successful}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-danger-600" />
                <span className="text-danger-700">失敗：{failed}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-neutral-500" />
                <span className="text-neutral-600">待處理：{recipes.length - completed}</span>
              </div>
            </div>
          </div>

          {/* Results List */}
          <ScrollArea className="flex-1 border rounded-md">
            <div className="p-4 space-y-2">
              {results.map((result, idx) => (
                <div
                  key={result.recipeId}
                  className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
                >
                  <div className="shrink-0">
                    {result.status === 'pending' && (
                      <div className="h-5 w-5 rounded-full border-2 border-neutral-300" />
                    )}
                    {result.status === 'analyzing' && (
                      <Loader2 className="h-5 w-5 text-primary-600 animate-spin" />
                    )}
                    {result.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-success-600" />
                    )}
                    {result.status === 'failed' && (
                      <XCircle className="h-5 w-5 text-danger-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-neutral-800 truncate">
                      {result.recipeName}
                    </p>
                    {result.error && (
                      <p className="text-xs text-danger-600 truncate">
                        {result.error}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {result.status === 'pending' && (
                      <Badge variant="outline" className="text-xs">待處理</Badge>
                    )}
                    {result.status === 'analyzing' && (
                      <Badge className="text-xs bg-primary-500">分析中...</Badge>
                    )}
                    {result.status === 'success' && (
                      <Badge className="text-xs bg-success-500">完成</Badge>
                    )}
                    {result.status === 'failed' && (
                      <Badge variant="destructive" className="text-xs">失敗</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-neutral-600">
              {isComplete && (
                <span className="text-success-700 font-medium">
                  ✓ 分析完成！成功 {successful} 個，失敗 {failed} 個
                </span>
              )}
              {isCancelled && !isAnalyzing && (
                <span className="text-warning-700 font-medium">
                  ⚠️ 已取消分析
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {!isAnalyzing && !isComplete && (
                <Button onClick={startAnalysis} className="bg-primary-600 hover:bg-primary-700">
                  <Brain className="h-4 w-4 mr-2" />
                  開始分析
                </Button>
              )}
              
              {isAnalyzing && (
                <Button onClick={handleCancel} variant="destructive">
                  取消
                </Button>
              )}
              
              {(isComplete || (isCancelled && !isAnalyzing)) && (
                <Button onClick={handleClose}>
                  關閉
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

