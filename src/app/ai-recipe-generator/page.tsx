'use client'

import { useState, useEffect, useMemo } from 'react'
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { LiquidGlassFooter } from '@/components/ui/liquid-glass-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { IconContainer } from '@/components/ui/icon-container'
import { ModelBadge } from '@/components/ui/model-badge'
import { AIRecipeRequest } from '@/types/v2-types'
import { Sparkles, Loader2, Copy, RefreshCw, MessageCircle, Send, AlertCircle, Clock, Repeat2 } from 'lucide-react'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { AIDisclaimer } from '@/components/ui/ai-disclaimer'
import Link from 'next/link'

type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error'

const MODEL_CONFIG = [
  {
    id: 'deepseek/deepseek-v3.1-terminus',
    name: 'DeepSeek V3.1 Terminus',
    badgeType: 'info' as const,
    iconVariant: 'info' as const,
    description: '高性價比深度推理，全面分析配方可行性'
  },
  {
    id: 'openai/gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    badgeType: 'gpt-mini' as const,
    iconVariant: 'success' as const,
    description: '快速精準評估配方安全性與功效'
  },
  {
    id: 'x-ai/grok-4-fast',
    name: 'Grok 4 Fast',
    badgeType: 'grok' as const,
    iconVariant: 'primary' as const,
    description: '超快速生成創新配方與視覺化洞察'
  }
]

const formatDuration = (startedAt?: number, finishedAt?: number) => {
  if (!startedAt) return null
  const end = finishedAt || Date.now()
  const seconds = Math.max(0, Math.round((end - startedAt) / 100) / 10)
  return `${seconds.toFixed(1)} 秒`
}

const STATUS_BADGE_CLASS: Record<AnalysisStatus, string> = {
  idle: 'bg-neutral-500/15 border border-neutral-300/40 text-neutral-600 dark:text-white/75',
  loading: 'bg-primary-500/15 border border-primary-300/40 text-primary-700',
  success: 'bg-success-500/15 border border-emerald-300/40 text-success-700',
  error: 'bg-danger-500/15 border border-red-300/40 text-danger-700'
}

const STATUS_LABEL: Record<AnalysisStatus, string> = {
  idle: '等待啟動',
  loading: '分析中',
  success: '完成',
  error: '錯誤'
}

export default function AIRecipeGeneratorPage() {
  const [formData, setFormData] = useState<AIRecipeRequest>({
    targetEffect: '',
    targetAudience: '一般成人',
    dosageForm: 'capsule',
    budget: ''
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [modelResponses, setModelResponses] = useState<Record<string, {
    modelId: string
    modelName: string
    content: string
    status: 'idle' | 'loading' | 'success' | 'error'
    error?: string
    startedAt?: number
    finishedAt?: number
  }>>({})
  const [error, setError] = useState<string | null>(null)
  const [isChatMode, setIsChatMode] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [hasRequested, setHasRequested] = useState(false)
  // Removed reasoning state - all models run as-is
  // 移除數據庫狀態檢查，改為純前端顯示

  // Removed reasoning preference localStorage logic

  const sortedModelResponses = useMemo(() => {
    return MODEL_CONFIG.map(model => {
      const response = modelResponses[model.id]
      return {
        config: model,
        response: response || {
          modelId: model.id,
          modelName: model.name,
          content: '',
          status: isGenerating ? 'loading' : 'idle'
        }
      }
    })
  }, [modelResponses, isGenerating])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setError(null)
    setHasRequested(true)
    setModelResponses({})

    try {
      const response = await fetch('/api/ai/recipe-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          // Removed reasoningMap - all models run as-is
        }),
      })

      if (!response.ok || !response.body) {
        const errorText = await response.text()
        throw new Error(errorText || 'AI 服務暫時無法回應')
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

        for (const eventBlock of events) {
          if (!eventBlock.trim()) continue

          const [eventLine, dataLine] = eventBlock.split('\n')
          if (!eventLine || !dataLine) continue

          const eventName = eventLine.replace('event: ', '').trim()
          const data = dataLine.replace('data: ', '')

          try {
            const payload = JSON.parse(data)
            const modelId = payload.modelId as string | undefined
            if (!modelId) continue

            if (eventName === 'start') {
              setModelResponses(prev => ({
                ...prev,
                [modelId]: {
                  modelId,
                  modelName: payload.modelName || modelId,
                  content: '',
                  status: 'loading',
                  startedAt: Date.now()
                }
              }))
            } else if (eventName === 'delta') {
              const delta = payload.delta as string
              setModelResponses(prev => ({
                ...prev,
                [modelId]: prev[modelId]
                  ? {
                      ...prev[modelId],
                      content: prev[modelId].content + delta
                    }
                  : {
                      modelId,
                      modelName: modelId,
                      content: delta,
                      status: 'loading',
                      startedAt: Date.now()
                    }
              }))
            } else if (eventName === 'error') {
              const message = payload.error || '生成失敗'
              setModelResponses(prev => ({
                ...prev,
                [modelId]: {
                  modelId,
                  modelName: prev[modelId]?.modelName || modelId,
                  content: prev[modelId]?.content || '',
                  status: 'error',
                  error: message,
                  startedAt: prev[modelId]?.startedAt,
                  finishedAt: Date.now()
                }
              }))
            } else if (eventName === 'done') {
              setModelResponses(prev => ({
                ...prev,
                [modelId]: {
                  modelId,
                  modelName: prev[modelId]?.modelName || modelId,
                  content: prev[modelId]?.content || '',
                  status: prev[modelId]?.status === 'error' ? 'error' : 'success',
                  error: prev[modelId]?.error,
                  startedAt: prev[modelId]?.startedAt,
                  finishedAt: Date.now()
                }
              }))
            } else if (eventName === 'close') {
              // Ignore, handled after loop
            }
          } catch (err) {
            // console.error('解析 AI 流式資料錯誤:', err)
          }
        }
      }
    } catch (err) {
      // console.error('AI 配方生成錯誤:', err)
      setError(err instanceof Error ? err.message : '配方生成失敗，請稍後再試')
    } finally {
      setIsGenerating(false)
    }
  }

  const primaryModelContext = useMemo(() => {
    const preference = ['anthropic/claude-sonnet-4.5', 'openai/gpt-5', 'x-ai/grok-4']
    for (const id of preference) {
      const res = modelResponses[id]
      if (res && res.status === 'success' && res.content.trim()) {
        return {
          id,
          name: res.modelName,
          content: res.content
        }
      }
    }
    return null
  }, [modelResponses])

  const handleCopy = async (modelId: string) => {
    const content = modelResponses[modelId]?.content
    if (content) {
      try {
        await navigator.clipboard.writeText(content)
        // 可以在這裡添加複製成功的提示
      } catch (err) {
        // console.error('複製失敗:', err)
      }
    }
  }

  const handleModelRetry = async (modelId: string) => {
    const model = MODEL_CONFIG.find(m => m.id === modelId)
    if (!model) return

    setModelResponses(prev => ({
      ...prev,
      [modelId]: {
        modelId,
        modelName: model.name,
        content: '',
        status: 'loading',
        startedAt: Date.now()
      }
    }))

    try {
      const response = await fetch('/api/ai/recipe-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          singleModel: modelId,
          // Removed reasoningMap - all models run as-is
        })
      })

      if (!response.ok || !response.body) {
        const errorText = await response.text()
        throw new Error(errorText || 'AI 服務暫時無法回應')
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

        for (const eventBlock of events) {
          const [eventLine, dataLine] = eventBlock.split('\n')
          if (!eventLine || !dataLine) continue

          const eventName = eventLine.replace('event: ', '').trim()
          const data = dataLine.replace('data: ', '')

          try {
            const payload = JSON.parse(data)
            if (payload.modelId !== modelId) continue

            if (eventName === 'delta') {
              const delta = payload.delta as string
              setModelResponses(prev => ({
                ...prev,
                [modelId]: {
                  ...prev[modelId],
                  content: (prev[modelId]?.content || '') + delta,
                  status: 'loading'
                }
              }))
            } else if (eventName === 'error') {
              const message = payload.error || '生成失敗'
              setModelResponses(prev => ({
                ...prev,
                [modelId]: {
                  ...prev[modelId],
                  status: 'error',
                  error: message,
                  finishedAt: Date.now()
                }
              }))
            } else if (eventName === 'done') {
              setModelResponses(prev => ({
                ...prev,
                [modelId]: {
                  ...prev[modelId],
                  status: prev[modelId]?.status === 'error' ? 'error' : 'success',
                  finishedAt: Date.now()
                }
              }))
            }
          } catch (error) {
            // console.error('解析重試回應失敗:', error)
          }
        }
      }
    } catch (error) {
      setModelResponses(prev => ({
        ...prev,
        [modelId]: {
          ...prev[modelId],
          status: 'error',
          error: error instanceof Error ? error.message : '未知錯誤',
          finishedAt: Date.now()
        }
      }))
    }
  }

  const handleStartChat = () => {
    setIsChatMode(true)
    setChatMessages([
      {
        role: 'assistant',
        content: `您好！我是您的 AI 配方助手。我已經為您生成了「${formData.targetEffect}」的配方。\n\n您可以告訴我如何優化這個配方，例如：\n- 調整膠囊規格（顏色、大小、材料）\n- 優化原料配比和劑量\n- 提高生產效率\n- 改善產品穩定性\n- 優化包裝方案\n- 批量採購原料建議\n- 生產工藝優化建議\n- 符合特定認證要求\n- 滿足特殊客戶需求\n\n請描述您的具體需求，我會為您提供專業的配方優化建議！`
      }
    ])

    // 滾動到聊天框
    setTimeout(() => {
      const chatElement = document.getElementById('ai-chat-container')
      if (chatElement) {
        chatElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }
    }, 100)
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isChatLoading) return

    const userMessage = chatInput.trim()
    setChatInput('')
    setIsChatLoading(true)

    // 添加用戶消息
    const newMessages = [...chatMessages, { role: 'user' as const, content: userMessage }]
    setChatMessages(newMessages)

    try {
      const response = await fetch('/api/ai/recipe-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          context: {
            currentRecipe: primaryModelContext,
            originalRequest: formData
          }
        }),
      })

      const result = await response.json()

      if (result.success) {
        setChatMessages([...newMessages, { role: 'assistant', content: result.message }])
      } else {
        setChatMessages([...newMessages, { role: 'assistant', content: '抱歉，我暫時無法回應。請稍後再試。' }])
      }
    } catch (err) {
      setChatMessages([...newMessages, { role: 'assistant', content: '抱歉，發生了網絡錯誤。請稍後再試。' }])
    } finally {
      setIsChatLoading(false)
    }
  }

  return (
    <div className="min-h-screen logo-bg-animation flex flex-col">
      <LiquidGlassNav />
      
      <div className="page-content-padding-top px-4 sm:px-6 md:px-8 space-y-8 floating-combined pb-24">
          {/* 頁面標題 */}
          <div className="text-center mb-6 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/15 border border-primary-300/40 text-xs font-medium text-primary-700">
              <span className="h-2 w-2 rounded-full bg-primary-500" />
              AI 配方工具
            </div>
            <h1 className="text-2xl md:text-xl font-semibold text-neutral-800 dark:text-white/95">
              AI 配方生成器
            </h1>
            <p className="text-sm md:text-sm text-neutral-600 dark:text-white/75 max-w-3xl mx-auto">
              輸入產品目標即可獲得原料建議、功效描述與製程提示，快速建立符合客戶需求的配方草稿。
            </p>
          </div>

          {/* 表單區域 */}
          <Card className="liquid-glass-card liquid-glass-card-elevated mb-8">
            <div className="liquid-glass-content">
              <div className="flex items-center space-x-3 mb-6">
                <IconContainer icon={Sparkles} variant="info" size="md" />
                <h2 className="text-lg font-semibold text-neutral-800 dark:text-white/95">代工配方需求</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                    目標功效 *
                  </label>
                  <Input
                    value={formData.targetEffect}
                    onChange={(e) => setFormData({ ...formData, targetEffect: e.target.value })}
                    placeholder="例如：提升免疫力、改善睡眠、增強記憶力"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                      目標受眾
                    </label>
                    <Select
                      value={formData.targetAudience}
                      onValueChange={(value) => setFormData({ ...formData, targetAudience: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="一般成人">一般成人</SelectItem>
                        <SelectItem value="中老年人">中老年人</SelectItem>
                        <SelectItem value="上班族">上班族</SelectItem>
                        <SelectItem value="學生">學生</SelectItem>
                        <SelectItem value="運動員">運動員</SelectItem>
                        <SelectItem value="孕婦">孕婦</SelectItem>
                        <SelectItem value="兒童">兒童</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                      劑型
                    </label>
                    <div className="px-3 py-2 bg-surface-primary border border-neutral-300 rounded-lg text-neutral-800 dark:text-white/95">
                      <span className="flex items-center">
                        <span className="mr-2">💊</span>
                        膠囊（固定）
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                    特別要求（可選）
                  </label>
                  <Textarea
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="例如：需要素食膠囊、無麩質、有機認證、特定顏色、特殊包裝要求、生產工藝限制等"
                    rows={3}
                  />
                  <p className="text-xs text-neutral-500 dark:text-white/65 mt-1">
                    請描述任何特殊要求或限制，AI 會據此調整配方建議
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isGenerating || !formData.targetEffect}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      生成配方
                    </>
                  )}
                </Button>
              </form>
            </div>
          </Card>

          {/* 錯誤提示 */}
          {error && (
            <Card className="liquid-glass-card liquid-glass-card-warning mb-8">
              <div className="liquid-glass-content">
                <div className="flex items-center space-x-3">
                  <IconContainer icon={AlertCircle} variant="danger" size="md" />
                  <p className="text-danger-700 dark:text-danger-400">{error}</p>
                </div>
              </div>
            </Card>
          )}

          {/* 生成中狀態 */}
          {isGenerating && (
            <Card className="liquid-glass-card liquid-glass-card-elevated">
              <div className="liquid-glass-content">
                <div className="text-center py-12">
                  <div className="mx-auto mb-6 flex justify-center">
                    <IconContainer icon={Loader2} variant="primary" size="lg" className="animate-spin" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-800 dark:text-white/95 mb-4">
                    🤖 AI 正在生成配方...
                  </h3>
                  <div className="space-y-3 text-neutral-600 dark:text-white/75">
                    <p>正在分析您的需求...</p>
                    <div className="flex justify-center space-x-2">
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <p className="text-sm">這可能需要 10-30 秒，請耐心等待...</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* 生成結果 */}
          <div className="space-y-6">
            {sortedModelResponses.map((model) => {
              const timeText = formatDuration(model.response.startedAt, model.response.finishedAt)
              const showCursor = model.response.status === 'loading'

              return (
                <Card
                  key={model.config.id}
                  interactive={false}
                  tone={
                    model.response.status === 'error'
                      ? 'negative'
                      : model.response.status === 'success'
                        ? 'positive'
                        : 'neutral'
                  }
                  className="liquid-glass-card liquid-glass-card-elevated"
                >
                  <div className="liquid-glass-content p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                      <div className="flex items-start sm:items-center gap-3">
                        <IconContainer icon={Sparkles} variant={model.config.iconVariant} size="md" />
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-lg font-semibold text-neutral-800 dark:text-white/95">{model.config.name}</h2>
                            <ModelBadge model={model.config.badgeType} />
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium min-w-[64px] justify-center ${STATUS_BADGE_CLASS[model.response.status]}`}>
                              {STATUS_LABEL[model.response.status]}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-600 dark:text-white/75">{model.config.description}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        {timeText && (
                          <span className="inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-white/65 bg-surface-primary/60 rounded-full px-2.5 py-1">
                            <Clock className="h-3.5 w-3.5" />
                            {timeText}
                          </span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(model.config.id)}
                          disabled={!model.response.content}
                          className="flex items-center gap-1"
                        >
                          <Copy className="h-4 w-4" />
                          複製
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleModelRetry(model.config.id)}
                          disabled={model.response.status === 'loading'}
                          className="flex items-center gap-1"
                        >
                          <Repeat2 className="h-4 w-4" />
                          重試
                        </Button>
                        {/* Removed deep thinking checkbox - all models run as-is */}
                      </div>
                    </div>

                    {model.response.status === 'error' ? (
                      <div className="flex items-center gap-3 p-4 rounded-lg border border-red-200 bg-danger-50 text-danger-700">
                        <AlertCircle className="h-5 w-5" />
                        <div className="text-sm">
                          <p className="font-medium">生成失敗</p>
                          <p className="text-xs text-danger-600">{model.response.error || '請稍後再試。'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="prose max-w-none overflow-x-auto">
                          {model.response.content ? (
                            <MarkdownRenderer content={model.response.content} />
                          ) : hasRequested ? (
                            <p className="text-sm text-neutral-500 dark:text-white/65">模型已排隊，等待開始輸出...</p>
                          ) : (
                            <p className="text-sm text-neutral-400 dark:text-white/55">按「生成配方」後，此處會顯示 AI 回應。</p>
                          )}
                        </div>
                        {showCursor && (
                          <span className="absolute bottom-0 left-0 w-2 h-5 bg-primary-500/70 animate-pulse"></span>
                        )}
                      </div>
                    )}

                    {model.response.status === 'success' && (
                      <div className="mt-6">
                        <AIDisclaimer type="recipe" />
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>

          {/* 聊天界面 */}
          {isChatMode && (
            <Card id="ai-chat-container" className="liquid-glass-card liquid-glass-card-elevated mt-6">
              <div className="liquid-glass-content p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <IconContainer icon={MessageCircle} variant="primary" size="md" />
                  <h2 className="text-lg font-semibold text-neutral-800 dark:text-white/95">AI 配方助手</h2>
                </div>

                {/* 聊天消息 */}
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-3xl p-4 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-primary-500 text-white'
                            : 'bg-neutral-100 text-neutral-800 dark:text-white/95'
                        }`}
                      >
                        <div className="prose prose-sm max-w-none">
                          <MarkdownRenderer content={message.content} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-neutral-100 text-neutral-800 dark:text-white/95 p-4 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>AI 正在思考...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 聊天輸入 */}
                <form onSubmit={handleChatSubmit} className="flex space-x-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="請描述您希望如何修改配方..."
                    className="flex-1"
                    disabled={isChatLoading}
                  />
                  <Button type="submit" disabled={isChatLoading || !chatInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>

                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsChatMode(false)}
                    className="text-neutral-600 dark:text-white/75"
                  >
                    關閉對話
                  </Button>
                </div>
              </div>
            </Card>
          )}
      </div>

      {/* Footer */}
      <LiquidGlassFooter />
    </div>
  )
}
