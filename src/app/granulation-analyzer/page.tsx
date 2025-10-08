'use client'

import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { LiquidGlassFooter } from '@/components/ui/liquid-glass-footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Brain, Loader2, AlertCircle, RefreshCw, Copy, Repeat2, Clock, PauseCircle, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { useToast } from '@/components/ui/toast-provider'

const SmartRecipeImport = dynamic(
  () => import('@/components/forms/smart-recipe-import').then(mod => mod.SmartRecipeImport),
  { ssr: false }
)

interface Ingredient {
  materialName: string
  unitContentMg: number
  isCustomerProvided: boolean
}

type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error'

interface GranulationAnalysis {
  modelId: string
  modelName: string
  content: string
  status: AnalysisStatus
  error?: string | null
  startedAt?: number
  endedAt?: number
}

interface ModelConfig {
  id: string
  name: string
  badgeClass: string
  iconClass: string
  description: string
  supportsReasoning: boolean
}

const MODEL_CONFIG = [
  {
    id: 'openai/gpt-4.1-mini',
    name: 'OpenAI GPT-4.1 Mini',
    badgeClass: 'badge-gpt',
    description: '擅長結構化評分與合規審視',
    iconClass: 'icon-container-violet',
    supportsReasoning: false
  },
  {
    id: 'x-ai/grok-4-fast',
    name: 'xAI Grok 4 Fast',
    badgeClass: 'badge-grok',
    description: '快速生成視覺化重點摘要與洞見',
    iconClass: 'icon-container-blue',
    supportsReasoning: false
  },
  {
    id: 'deepseek/deepseek-chat-v3.1',
    name: 'DeepSeek v3.1',
    badgeClass: 'badge-deepseek',
    description: '深入分析流動性參數與改善方案',
    iconClass: 'icon-container-emerald',
    supportsReasoning: true
  }
]

const formatDuration = (startedAt?: number, finishedAt?: number) => {
  if (!startedAt) return null
  const end = finishedAt || Date.now()
  const seconds = Math.max(0, Math.round((end - startedAt) / 100) / 10)
  return `${seconds.toFixed(1)} 秒`
}

const STATUS_BADGE_CLASS: Record<AnalysisStatus, string> = {
  idle: 'bg-slate-500/10 border border-slate-300/40 text-slate-600',
  loading: 'bg-blue-500/15 border border-blue-300/40 text-blue-700',
  success: 'bg-emerald-500/15 border border-emerald-300/40 text-emerald-700',
  error: 'bg-red-500/15 border border-red-300/40 text-red-700'
}

const STATUS_LABEL: Record<AnalysisStatus, string> = {
  idle: '待開始',
  loading: '分析中',
  success: '完成',
  error: '錯誤'
}

export default function GranulationAnalyzerPage() {
  const { showToast } = useToast()
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { materialName: '', unitContentMg: 0, isCustomerProvided: true }
  ])
  const [analyses, setAnalyses] = useState<Record<string, GranulationAnalysis>>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [hasRequested, setHasRequested] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [reasoningEnabled, setReasoningEnabled] = useState<Record<string, boolean>>({})
  const [consensus, setConsensus] = useState<GranulationAnalysis | null>(null)

  const controllerRef = useRef<AbortController | null>(null)
  const consensusControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('granulation-reasoning-pref')
    if (stored) {
      try {
        setReasoningEnabled(JSON.parse(stored) as Record<string, boolean>)
        return
      } catch (error) {
        console.warn('無法解析製粒深度思考偏好，將重置。', error)
      }
    }
    setReasoningEnabled({})
  }, [])

  useEffect(() => {
    localStorage.setItem('granulation-reasoning-pref', JSON.stringify(reasoningEnabled))
  }, [reasoningEnabled])

  useEffect(() => {
    return () => {
      controllerRef.current?.abort()
      consensusControllerRef.current?.abort()
    }
  }, [])

  const handleSmartImport = (importedIngredients: any[]) => {
    try {
      const newIngredients = importedIngredients.length > 0
        ? importedIngredients
            .map((ing) => ({
              materialName: String(ing.materialName || '').trim(),
              unitContentMg: Number(ing.unitContentMg) || 0,
              isCustomerProvided: true
            }))
            .filter((item) => item.materialName !== '')
        : [{ materialName: '', unitContentMg: 0, isCustomerProvided: true }]

      setIngredients(newIngredients)
      showToast({
        title: '原料已導入',
        description: '已套用智能導入的原料清單。'
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

  const analyzeGranulation = async () => {
    if (ingredients.length === 0 || ingredients[0].materialName === '') {
      showToast({
        title: '缺少原料資料',
        description: '請先輸入原料配方後再開始分析。',
        variant: 'destructive'
      })
      return
    }

    setIsAnalyzing(true)
    setHasRequested(true)
    setGlobalError(null)
    setConsensus(null)

    controllerRef.current?.abort()
    controllerRef.current = new AbortController()
    consensusControllerRef.current?.abort()
    consensusControllerRef.current = null

    setAnalyses(
      MODEL_CONFIG.reduce<Record<string, GranulationAnalysis>>((acc, model) => {
        acc[model.id] = {
          modelId: model.id,
          modelName: model.name,
          content: '',
          status: 'loading',
          startedAt: Date.now()
        }
        return acc
      }, {})
    )

    try {
      const response = await fetch('/api/ai/granulation-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ingredients: ingredients.filter((ing) => ing.materialName && ing.unitContentMg > 0),
          reasoningMap: Object.fromEntries(
            MODEL_CONFIG.filter(model => model.supportsReasoning).map(model => [model.id, !!reasoningEnabled[model.id]])
          )
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
            const modelId = payload.modelId as string | undefined
            if (!modelId) continue

            if (eventName === 'start') {
              setAnalyses((prev) => ({
                ...prev,
                [modelId]: {
                  modelId,
                  modelName: payload.modelName || MODEL_CONFIG.find((m) => m.id === modelId)?.name || modelId,
                  content: '',
                  status: 'loading',
                  startedAt: Date.now(),
                  endedAt: undefined,
                  error: null
                }
              }))
            } else if (eventName === 'delta') {
              const delta = payload.delta as string
              setAnalyses((prev) => ({
                ...prev,
                [modelId]: prev[modelId]
                  ? {
                      ...prev[modelId],
                      content: (prev[modelId].content || '') + delta,
                      status: 'loading'
                    }
                  : {
                      modelId,
                      modelName: MODEL_CONFIG.find((m) => m.id === modelId)?.name || modelId,
                      content: delta,
                      status: 'loading',
                      startedAt: Date.now(),
                      endedAt: undefined,
                      error: null
                    }
              }))
            } else if (eventName === 'error') {
              setAnalyses((prev) => ({
                ...prev,
                [modelId]: {
                  ...prev[modelId],
                  status: 'error',
                  error: payload.error || '分析失敗',
                  endedAt: Date.now()
                }
              }))
              showToast({
                title: '分析失敗',
                description: payload.error || 'AI 分析時發生錯誤',
                variant: 'destructive'
              })
            } else if (eventName === 'done') {
              setAnalyses((prev) => {
                const existing = prev[modelId]
                if (!existing) return prev

                const successFlag = payload.success
                const payloadContent = typeof payload.content === 'string' ? payload.content : existing.content
                const payloadError = typeof payload.error === 'string' ? payload.error : existing.error
                const isError = successFlag === false || !!payloadError
                const nextStatus: AnalysisStatus = isError
                  ? 'error'
                  : existing.status === 'error'
                    ? 'error'
                    : 'success'

                return {
                  ...prev,
                  [modelId]: {
                    ...existing,
                    status: nextStatus,
                    content: payloadContent,
                    endedAt: Date.now(),
                    error: nextStatus === 'error' ? (payloadError || '分析失敗') : null
                  }
                }
              })
              showToast({
                title: successFlag === false ? '分析失敗' : '分析完成',
                description:
                  payload.success === false
                    ? payload.error || 'AI 分析時發生錯誤'
                    : `${MODEL_CONFIG.find(m => m.id === modelId)?.name || modelId} 的分析已完成。`,
                variant: successFlag === false ? 'destructive' : 'default'
              })
            }
          } catch (error) {
            console.error('解析流式資料錯誤:', error)
          }
        }
      }
    } catch (error) {
      console.error('製粒分析錯誤:', error)
      setGlobalError(error instanceof Error ? error.message : '分析失敗，請稍後再試。')
      showToast({
        title: '分析失敗',
        description: error instanceof Error ? error.message : '分析失敗，請稍後再試。',
        variant: 'destructive'
      })
      setAnalyses({})
    } finally {
      setIsAnalyzing(false)
      controllerRef.current = null
    }
  }

  const clearAnalysis = () => {
    controllerRef.current?.abort()
    controllerRef.current = null
    consensusControllerRef.current?.abort()
    consensusControllerRef.current = null
    setAnalyses({})
    setGlobalError(null)
    setConsensus(null)
  }

  const handleModelRetry = async (modelId: string) => {
    setAnalyses((prev) => ({
      ...prev,
      [modelId]: {
        modelId,
        modelName: MODEL_CONFIG.find((m) => m.id === modelId)?.name || modelId,
        content: '',
        status: 'loading',
        startedAt: Date.now(),
        endedAt: undefined,
        error: null
      }
    }))

    try {
      const response = await fetch('/api/ai/granulation-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ingredients: ingredients.filter((ing) => ing.materialName && ing.unitContentMg > 0),
          singleModel: modelId,
          reasoningMap: Object.fromEntries(
            MODEL_CONFIG.filter(cfg => cfg.supportsReasoning).map(cfg => [cfg.id, !!reasoningEnabled[cfg.id]])
          )
        })
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
            if (payload.modelId !== modelId) continue

            if (eventName === 'delta') {
              const delta = payload.delta as string
              setAnalyses((prev) => ({
                ...prev,
                [modelId]: {
                  ...prev[modelId],
                  content: (prev[modelId]?.content || '') + delta,
                  status: 'loading'
                }
              }))
            } else if (eventName === 'error') {
              setAnalyses((prev) => ({
                ...prev,
                [modelId]: {
                  ...prev[modelId],
                  status: 'error',
                  error: payload.error || '分析失敗',
                  endedAt: Date.now()
                }
              }))
            } else if (eventName === 'done') {
              setAnalyses((prev) => ({
                ...prev,
                [modelId]: {
                  ...prev[modelId],
                  status: prev[modelId]?.status === 'error' ? 'error' : 'success',
                  endedAt: Date.now()
                }
              }))
            }
          } catch (error) {
            console.error('重試解析錯誤:', error)
          }
        }
      }
    } catch (error) {
      setAnalyses((prev) => ({
        ...prev,
        [modelId]: {
          ...prev[modelId],
          status: 'error',
          error: error instanceof Error ? error.message : '分析失敗',
          endedAt: Date.now()
        }
      }))
    }
  }

  const handleCopy = async (modelId: string) => {
    const content = analyses[modelId]?.content
    if (!content) return

    try {
      await navigator.clipboard.writeText(content)
    } catch (error) {
      console.error('複製失敗:', error)
    }
  }

  const sortedAnalyses = useMemo(() => {
    return MODEL_CONFIG.map((model) => ({
      config: model,
      analysis: analyses[model.id] || {
        modelId: model.id,
        modelName: model.name,
        content: '',
        status: hasRequested ? 'loading' : 'idle'
      }
    }))
  }, [analyses, hasRequested])

  const isAnyLoading = sortedAnalyses.some((item) => item.analysis.status === 'loading')
  const successfulAnalysesCount = sortedAnalyses.filter((item) => item.analysis.status === 'success' && (item.analysis.content || '').trim()).length
  const consensusStatus: AnalysisStatus = consensus?.status ?? 'idle'
  const consensusDuration = formatDuration(consensus?.startedAt, consensus?.endedAt)

  const generateConsensus = useCallback(async () => {
    const successfulAnalyses = MODEL_CONFIG.filter((model) => {
      const analysis = analyses[model.id]
      return analysis?.status === 'success' && (analysis.content || '').trim()
    })

    if (successfulAnalyses.length < 2) {
      showToast({
        title: '資料不足',
        description: '至少需要兩個模型成功輸出才能生成最終結論。',
        variant: 'destructive'
      })
      return
    }

    consensusControllerRef.current?.abort()
    const controller = new AbortController()
    consensusControllerRef.current = controller

    setConsensus({
      modelId: 'consensus',
      modelName: '交叉驗證結論',
      content: '',
      status: 'loading',
      startedAt: Date.now()
    })

    try {
      const response = await fetch('/api/ai/granulation-consensus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: ingredients.filter((ing) => ing.materialName && ing.unitContentMg > 0),
          analyses: MODEL_CONFIG.map((model) => ({
            modelId: model.id,
            modelName: model.name,
            content: analyses[model.id]?.content || ''
          })).filter((item) => item.content.trim()),
          enableReasoning: Boolean(reasoningEnabled['deepseek/deepseek-chat-v3.1'])
        }),
        signal: controller.signal
      })

      if (!response.ok || !response.body) {
        const errorText = await response.text().catch(() => '')
        throw new Error(errorText || '最終結論服務暫時無法使用')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
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
              if (!delta) continue
              setConsensus((prev) =>
                prev
                  ? {
                      ...prev,
                      content: (prev.content || '') + delta
                    }
                  : prev
              )
            } else if (eventName === 'error') {
              setConsensus((prev) =>
                prev
                  ? {
                      ...prev,
                      status: 'error',
                      error: payload.error || '生成最終結論失敗',
                      endedAt: Date.now()
                    }
                  : prev
              )
              showToast({
                title: '生成失敗',
                description: payload.error || '最終結論生成時發生錯誤。',
                variant: 'destructive'
              })
            } else if (eventName === 'done') {
              setConsensus((prev) =>
                prev
                  ? {
                      ...prev,
                      status: payload.success ? 'success' : 'error',
                      content: payload.success ? payload.content || prev.content : prev.content,
                      endedAt: Date.now(),
                      error: payload.success ? null : payload.error || '生成最終結論失敗'
                    }
                  : prev
              )
            }
          } catch (error) {
            console.error('共識流資料解析錯誤:', error)
          }
        }
      }
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') {
        return
      }

      setConsensus((prev) =>
        prev
          ? {
              ...prev,
              status: 'error',
              error: error instanceof Error ? error.message : '生成最終結論失敗',
              endedAt: Date.now()
            }
          : prev
      )
      showToast({
        title: '生成失敗',
        description: error instanceof Error ? error.message : '最終結論服務暫時無法使用。',
        variant: 'destructive'
      })
    } finally {
      consensusControllerRef.current = null
    }
  }, [analyses, ingredients, reasoningEnabled, showToast])

  useEffect(() => {
    const allSuccess = MODEL_CONFIG.every((model) => analyses[model.id]?.status === 'success')
    if (allSuccess && !consensus && hasRequested && !isAnalyzing) {
      generateConsensus()
    }
  }, [analyses, consensus, generateConsensus, hasRequested, isAnalyzing])

  return (
    <div className="min-h-screen logo-bg-animation flex flex-col">
      <LiquidGlassNav />
      
      <main className="flex-1">
        <div className="pt-24 sm:pt-24 px-4 sm:px-6 md:px-8 space-y-8 pb-8">
          {/* 頁面標題 */}
          <div className="text-center mb-6 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/15 border border-blue-300/40 text-xs font-medium text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              AI 製粒工具
            </div>
            <h1 className="text-2xl md:text-xl font-semibold text-gray-800">
              多模型製粒分析
            </h1>
            <p className="text-sm md:text-sm text-gray-600 max-w-2xl mx-auto">
              使用三個不同的 AI 模型同時分析配方是否需要製粒，提供多角度專業見解
            </p>
          </div>
          
          {/* 配方輸入區域 */}
          <Card className="liquid-glass-card liquid-glass-card-elevated" interactive={false}>
            <div className="liquid-glass-content">
              <div className="flex items-center space-x-3 mb-6">
                <div className="icon-container icon-container-emerald">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">配方輸入</h2>
              </div>

              <div className="space-y-6">
                <div className="flex gap-2 mb-4">
                  <SmartRecipeImport onImport={handleSmartImport} />
                  <Badge variant="outline" className="text-xs">
                    智能導入支援文字和圖片
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {ingredients.map((ingredient, index) => (
                    <div key={index} className="flex gap-3 items-center p-4 bg-white rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          原料名稱
                        </label>
                        <input
                          type="text"
                          value={ingredient.materialName}
                          onChange={(e) => {
                            const newIngredients = [...ingredients]
                            newIngredients[index] = { ...ingredient, materialName: e.target.value }
                            setIngredients(newIngredients)
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="輸入原料名稱"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          單粒重量 (mg)
                        </label>
                        <input
                          type="number"
                          value={ingredient.unitContentMg || ''}
                          onChange={(e) => {
                            const newIngredients = [...ingredients]
                            newIngredients[index] = { ...ingredient, unitContentMg: Number(e.target.value) || 0 }
                            setIngredients(newIngredients)
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="輸入重量"
                        />
                      </div>
                      <div className="flex-shrink-0 flex flex-col gap-2 items-end">
                        <label className="flex items-center gap-2 text-xs text-gray-500">
                          <input
                            type="checkbox"
                            checked={ingredient.isCustomerProvided}
                            onChange={(event) => {
                              const newIngredients = [...ingredients]
                              newIngredients[index] = { ...ingredient, isCustomerProvided: event.target.checked }
                              setIngredients(newIngredients)
                            }}
                            className="rounded border-gray-300"
                          />
                          客戶提供
                        </label>
                        <button
                          onClick={() => {
                            if (ingredients.length > 1) {
                              const newIngredients = ingredients.filter((_, i) => i !== index)
                              setIngredients(newIngredients)
                            }
                          }}
                          className="px-3 py-2 text-red-600 hover:text-red-800 text-sm"
                          disabled={ingredients.length === 1}
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setIngredients((prev) => [
                        ...prev,
                        { materialName: '', unitContentMg: 0, isCustomerProvided: true }
                      ])
                    }
                    className="flex items-center gap-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                  >
                    <span className="text-lg leading-none">＋</span>
                    新增原料
                  </Button>
                  <Badge variant="outline" className="text-xs text-gray-500">
                    已輸入 {ingredients.length} 項原料
                  </Badge>
                </div>

                <div className="text-center">
                  <button
                    onClick={analyzeGranulation}
                    disabled={isAnalyzing || ingredients.length === 0 || ingredients[0].materialName === ''}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        三模型分析中...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        開始製粒分析
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* 分析結果 */}
        {sortedAnalyses.length > 0 && (
          <Card className="liquid-glass-card liquid-glass-card-elevated" interactive={false}>
              <div className="liquid-glass-content">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="icon-container icon-container-emerald">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">多模型分析結果</h2>
                      <p className="text-sm text-gray-500">對照三個模型的分析輸出，擷取最合適的建議。</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAnalysis}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      清除結果
                    </Button>
                    {isAnyLoading && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          controllerRef.current?.abort()
                          controllerRef.current = null
                          setIsAnalyzing(false)
                        }}
                        className="flex items-center gap-2 text-amber-600 border-amber-300 hover:bg-amber-50"
                      >
                        <PauseCircle className="w-4 h-4" />
                        停止等待
                      </Button>
                    )}
                  </div>
                </div>

                {globalError && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{globalError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-6">
                  {sortedAnalyses.map(({ config, analysis }) => {
                    const duration = formatDuration(analysis.startedAt, analysis.endedAt)
                    return (
                      <Card key={config.id} interactive={false} tone="neutral" className="liquid-glass-card liquid-glass-card-elevated">
                        <div className="liquid-glass-content">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                            <div className="flex items-start sm:items-center gap-3">
                              <div className={`icon-container ${config.iconClass}`}>
                                <Sparkles className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className="text-base font-semibold text-gray-800">{config.name}</h3>
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium min-w-[64px] justify-center ${STATUS_BADGE_CLASS[analysis.status]}`}>
                                    {STATUS_LABEL[analysis.status]}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500">{config.description}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                              {duration && (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-white/70 px-2.5 py-1 rounded-full">
                                  <Clock className="h-3.5 w-3.5" />
                                  {duration}
                                </span>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopy(config.id)}
                                disabled={!analysis.content}
                                className="flex items-center gap-1"
                              >
                                <Copy className="h-4 w-4" />
                                複製
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleModelRetry(config.id)}
                                disabled={analysis.status === 'loading'}
                                className="flex items-center gap-1"
                              >
                                <Repeat2 className="h-4 w-4" />
                                重試
                              </Button>
                        {config.supportsReasoning && (
                                <label className="flex items-center gap-1 text-xs text-gray-500">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300"
                                    checked={!!reasoningEnabled[config.id]}
                                    onChange={(event) =>
                                      setReasoningEnabled(prev => ({
                                        ...prev,
                                        [config.id]: event.target.checked
                                      }))
                                    }
                                  />
                                  深度思考
                                </label>
                              )}
                            </div>
                          </div>
                          {analysis.status === 'error' ? (
                            <div className="flex items-start gap-3 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
                              <AlertCircle className="h-5 w-5" />
                              <div className="text-sm">
                                <p className="font-medium">分析失敗</p>
                                <p className="text-xs text-red-600">{analysis.error || '請稍後再試。'}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              <div className="prose max-w-none overflow-x-auto">
                                {analysis.content ? (
                                  <MarkdownRenderer content={analysis.content} />
                                ) : hasRequested ? (
                                  <p className="text-sm text-gray-500">模型已啟動，正在生成分析內容...</p>
                                ) : (
                                  <p className="text-sm text-gray-400">按「開始製粒分析」後，此處會顯示模型的詳細結果。</p>
                                )}
                              </div>
                              {analysis.status === 'loading' && (
                                <span className="absolute bottom-0 left-0 w-2 h-5 bg-blue-500/70 animate-pulse"></span>
                              )}
                            </div>
                          )}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </Card>
          )}

          {sortedAnalyses.length > 0 && (
            <Card className="liquid-glass-card liquid-glass-card-elevated" interactive={false}>
              <div className="liquid-glass-content">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="icon-container icon-container-violet">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">交叉驗證最終結論</h2>
                      <p className="text-sm text-gray-500">綜合三個模型輸出，產生可執行的最終建議。</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {consensusDuration && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-white/70 px-2.5 py-1 rounded-full">
                        <Clock className="h-3.5 w-3.5" />
                        {consensusDuration}
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium min-w-[72px] justify-center ${STATUS_BADGE_CLASS[consensusStatus]}`}>
                      {STATUS_LABEL[consensusStatus]}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateConsensus}
                      disabled={consensusStatus === 'loading' || successfulAnalysesCount < 2}
                      className="flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      生成最終結論
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <div className="prose max-w-none overflow-x-auto">
                    {consensus?.content ? (
                      <MarkdownRenderer content={consensus.content} />
                    ) : consensusStatus === 'loading' ? (
                      <p className="text-sm text-gray-500">正在生成綜合結論...</p>
                    ) : (
                      <p className="text-sm text-gray-400">
                        當至少有兩個模型完成分析後，可點擊「生成最終結論」獲取交叉驗證建議。
                      </p>
                    )}
                  </div>
                  {consensusStatus === 'loading' && (
                    <span className="absolute bottom-0 left-0 w-2 h-5 bg-violet-500/70 animate-pulse" />
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>

      <LiquidGlassFooter />
    </div>
  )
}
