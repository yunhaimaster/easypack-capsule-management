'use client'

import { useState, useRef, useEffect } from 'react'
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { LiquidGlassFooter } from '@/components/ui/liquid-glass-footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IconContainer } from '@/components/ui/icon-container'
import { Brain, Loader2, Sparkles } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'
import { MarketingInput } from '@/components/marketing/marketing-input'
import { MarketingAnalysis } from '@/components/marketing/marketing-analysis'
import { AutoImageGallery } from '@/components/marketing/auto-image-gallery'
import { useImportReview } from '@/hooks/use-import-review'
import dynamic from 'next/dynamic'

const SmartRecipeImport = dynamic(
  () => import('@/components/forms/smart-recipe-import').then((mod) => mod.SmartRecipeImport),
  { ssr: false }
)

interface Ingredient {
  materialName: string
  unitContentMg: number
}

type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error'

export default function MarketingAssistantPage() {
  const { showToast } = useToast()
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { materialName: '', unitContentMg: 0 }
  ])
  const [analysisContent, setAnalysisContent] = useState('')
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle')
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [endTime, setEndTime] = useState<number | null>(null)
  const [nowTick, setNowTick] = useState(Date.now())

  const controllerRef = useRef<AbortController | null>(null)
  const { openReview, drawer } = useImportReview()

  useEffect(() => {
    return () => {
      controllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (analysisStatus !== 'loading') return
    const id = setInterval(() => {
      setNowTick(Date.now())
    }, 1000)
    return () => clearInterval(id)
  }, [analysisStatus])

  // 自動導入從配方庫傳來的原料
  useEffect(() => {
    const importedData = localStorage.getItem('marketing_imported_ingredients')
    if (importedData) {
      try {
        const imported = JSON.parse(importedData)
        if (Array.isArray(imported) && imported.length > 0) {
          setIngredients(imported)
          localStorage.removeItem('marketing_imported_ingredients')
          showToast({
            title: '原料已導入',
            description: '已從配方庫自動導入原料清單'
          })
        }
      } catch (error) {
        console.error('導入配方原料失敗:', error)
        localStorage.removeItem('marketing_imported_ingredients')
      }
    }
  }, [showToast])

  const handleSmartImport = (importedIngredients: any[]) => {
    try {
      const imported = (importedIngredients || [])
        .map((ing) => ({
          materialName: String(ing.materialName || '').trim(),
          unitContentMg: Number(ing.unitContentMg) || 0
        }))
        .filter((item) => item.materialName !== '')

      openReview(imported, ingredients, (merged) => {
        setIngredients(merged.length > 0 ? merged : [{ materialName: '', unitContentMg: 0 }])
        showToast({
          title: '已套用導入',
          description: `已更新 ${merged.length} 項原料。`
        })
      })
    } catch (error) {
      console.error('導入原料時發生錯誤:', error)
      showToast({
        title: '導入失敗',
        description: error instanceof Error ? error.message : '未知錯誤',
        variant: 'destructive'
      })
    }
  }

  const analyzeMarketing = async () => {
    if (ingredients.length === 0 || ingredients[0].materialName === '') {
      showToast({
        title: '缺少原料資料',
        description: '請先輸入原料配方後再開始分析。',
        variant: 'destructive'
      })
      return
    }

    controllerRef.current?.abort()
    controllerRef.current = new AbortController()

    setAnalysisStatus('loading')
    setAnalysisContent('')
    setAnalysisError(null)
    setStartTime(Date.now())
    setEndTime(null)
    setNowTick(Date.now())

    try {
      const response = await fetch('/api/ai/marketing-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: ingredients.filter((ing) => ing.materialName && ing.unitContentMg > 0)
        }),
        signal: controllerRef.current.signal
      })

      if (!response.ok || !response.body) {
        const errorText = await response.text()
        throw new Error(errorText || `API 請求失敗 (${response.status})`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''

        for (const block of events) {
          if (!block.trim()) continue

          const [eventLine, dataLine] = block.split('\n')
          if (!eventLine || !dataLine) continue

          const eventName = eventLine.replace('event: ', '').trim()
          const data = dataLine.replace('data: ', '')

          try {
            const payload = JSON.parse(data)

            if (eventName === 'delta') {
              const delta = payload.delta as string
              setAnalysisContent((prev) => prev + delta)
            } else if (eventName === 'error') {
              setAnalysisStatus('error')
              setAnalysisError(payload.error || '分析失敗')
              setEndTime(Date.now())
              showToast({
                title: '分析失敗',
                description: payload.error || 'AI 分析時發生錯誤',
                variant: 'destructive'
              })
            } else if (eventName === 'done') {
              setAnalysisStatus(payload.success ? 'success' : 'error')
              if (!payload.success) {
                setAnalysisError(payload.error || '分析失敗')
              }
              setEndTime(Date.now())
              if (payload.success) {
                showToast({
                  title: '分析完成',
                  description: '行銷策略分析已完成。'
                })
              }
            }
          } catch (error) {
            console.error('解析流式資料錯誤:', error)
          }
        }
      }
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') {
        return
      }

      console.error('行銷分析錯誤:', error)
      setAnalysisStatus('error')
      setAnalysisError(error instanceof Error ? error.message : '分析失敗，請稍後再試。')
      setEndTime(Date.now())
      showToast({
        title: '分析失敗',
        description: error instanceof Error ? error.message : '分析失敗，請稍後再試。',
        variant: 'destructive'
      })
    } finally {
      controllerRef.current = null
    }
  }

  const handleCopy = async () => {
    if (!analysisContent) return

    try {
      await navigator.clipboard.writeText(analysisContent)
      showToast({
        title: '已複製',
        description: '分析內容已複製到剪貼簿',
        variant: 'default'
      })
    } catch (error) {
      console.error('複製失敗:', error)
    }
  }

  const handleRetry = () => {
    analyzeMarketing()
  }


  const formatDuration = (start: number | null, end: number | null) => {
    if (!start) return null
    const endMs = end || Date.now()
    const seconds = Math.max(0, Math.round((endMs - start) / 100) / 10)
    return `${seconds.toFixed(1)} 秒`
  }

  const duration = formatDuration(startTime, analysisStatus === 'loading' ? nowTick : endTime)
  const loadingElapsedMs = startTime && analysisStatus === 'loading' ? nowTick - startTime : 0

  return (
    <div className="min-h-screen logo-bg-animation flex flex-col">
      <LiquidGlassNav />
      
      <main className="flex-1">
        <div className="pt-24 sm:pt-24 px-4 sm:px-6 md:px-8 space-y-8 pb-8 max-w-6xl mx-auto w-full">
          {/* 頁面標題 */}
          <div className="text-center mb-6 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-info-500/15 border border-violet-300/40 text-xs font-medium text-info-700">
              <span className="h-2 w-2 rounded-full bg-info-500" />
              AI 行銷工具
            </div>
            <h1 className="text-2xl md:text-xl font-semibold text-neutral-800">
              行銷設計助手
            </h1>
            <p className="text-sm md:text-sm text-neutral-600 max-w-2xl mx-auto">
              使用 DeepSeek Chat v3.1 分析配方，Doubao SeeDream 4.0 生成包裝圖像
            </p>
          </div>
          
          {/* 配方輸入區域 */}
          <Card className="liquid-glass-card liquid-glass-card-elevated" interactive={false}>
            <div className="liquid-glass-content p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-3 sm:space-y-0 mb-6">
                <IconContainer icon={Brain} variant="info" size="md" />
                <h2 className="text-lg font-semibold text-neutral-800">配方輸入</h2>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                  <SmartRecipeImport onImport={handleSmartImport} />
                  <Badge variant="outline" className="text-xs">
                    智能導入支援文字和圖片
                  </Badge>
                </div>
                
                <MarketingInput ingredients={ingredients} setIngredients={setIngredients} />

                <div className="text-center">
                  <Button
                    onClick={analyzeMarketing}
                    disabled={analysisStatus === 'loading' || ingredients.length === 0 || ingredients[0].materialName === ''}
                    className="bg-gradient-to-r from-info-500 to-info-600 hover:from-info-600 hover:to-info-700 text-white w-full sm:w-auto transition-all duration-300"
                  >
                    {analysisStatus === 'loading' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        分析中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        開始行銷分析
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* 行銷分析結果 */}
          {(analysisStatus !== 'idle' || analysisContent) && (
            <MarketingAnalysis
              content={analysisContent}
              status={analysisStatus}
              error={analysisError}
              duration={duration}
              loadingElapsedMs={loadingElapsedMs}
              onCopy={handleCopy}
              onRetry={handleRetry}
            />
          )}

          {/* AI 圖像自動生成 */}
          {analysisContent && (
            <AutoImageGallery 
              analysisContent={analysisContent} 
              isAnalysisComplete={analysisStatus === 'success'}
            />
          )}
        </div>
      </main>

      <LiquidGlassFooter />
      {drawer}
    </div>
  )
}

