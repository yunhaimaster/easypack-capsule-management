'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { Sparkles, Copy, RefreshCw, Clock, CheckCircle, AlertCircle, Loader2, List } from 'lucide-react'

type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error'

interface MarketingAnalysisProps {
  content: string
  status: AnalysisStatus
  error?: string | null
  duration?: string | null
  loadingElapsedMs?: number
  onCopy: () => void
  onRetry: () => void
}

const STATUS_BADGE_CLASS: Record<AnalysisStatus, string> = {
  idle: 'bg-neutral-500/10 border border-neutral-300/40 text-neutral-600 dark:text-white/75',
  loading: 'bg-primary-500/15 border border-primary-300/40 text-primary-700',
  success: 'bg-success-500/15 border border-emerald-300/40 text-success-700',
  error: 'bg-danger-500/15 border border-red-300/40 text-danger-700'
}

const STATUS_LABEL: Record<AnalysisStatus, string> = {
  idle: '待開始',
  loading: '分析中',
  success: '完成',
  error: '錯誤'
}

export function MarketingAnalysis({ content, status, error, duration, loadingElapsedMs = 0, onCopy, onRetry }: MarketingAnalysisProps) {
  const loadingSeconds = Math.floor(loadingElapsedMs / 1000)
  const showDelayNotice = status === 'loading' && loadingSeconds >= 45

  // Extract H2 headings for Table of Contents
  const tableOfContents = useMemo(() => {
    if (!content) return []
    const headings: Array<{ id: string; title: string }> = []
    const lines = content.split('\n')
    
    lines.forEach((line) => {
      const h2Match = line.match(/^## (.+)$/)
      if (h2Match) {
        const title = h2Match[1].trim()
        const id = `section-${title.replace(/[^\w\s]/g, '').replace(/\s+/g, '-').toLowerCase()}`
        headings.push({ id, title })
      }
    })
    
    return headings
  }, [content])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <Card className="liquid-glass-card liquid-glass-card-elevated" interactive={false}>
      <div className="liquid-glass-content">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="icon-container icon-container-violet">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-white/95">行銷策略分析</h2>
              <p className="text-sm text-neutral-500 dark:text-white/65">DeepSeek V3.1 Terminus 專業行銷建議與包裝設計方案</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {duration && (
              <span className="inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-white/65 bg-white/70 px-2.5 py-1 rounded-full">
                <Clock className="h-3.5 w-3.5" />
                {duration}
              </span>
            )}
            <Badge className={`${STATUS_BADGE_CLASS[status]} min-w-[64px] justify-center`}>
              {STATUS_LABEL[status]}
            </Badge>
            {showDelayNotice && (
              <span className="inline-flex items-center gap-1 text-xs text-info-600 bg-info-100/80 px-2 py-1 rounded-full border border-violet-200">
                <Loader2 className="h-3 w-3 animate-spin" />
                DeepSeek V3.1 Terminus 深度思考中…
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onCopy}
              disabled={!content}
              className="flex items-center gap-1"
            >
              <Copy className="h-4 w-4" />
              複製
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              disabled={status === 'loading'}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              重試
            </Button>
          </div>
        </div>

        {/* Table of Contents */}
        {tableOfContents.length > 0 && status === 'success' && (
          <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="flex items-center gap-2 mb-3">
              <List className="h-4 w-4 text-neutral-600 dark:text-white/75" />
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-white/95">目錄</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {tableOfContents.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-left px-3 py-2 text-xs text-neutral-700 dark:text-white/85 hover:bg-white hover:text-primary-600 rounded transition-colors border border-transparent hover:border-primary-200"
                >
                  <span className="font-medium text-neutral-500 dark:text-white/65 mr-2">{index}.</span>
                  {item.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          {status === 'error' ? (
            <div className="flex items-start gap-3 p-4 rounded-lg border border-red-200 bg-danger-50 text-danger-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">分析失敗</p>
                <p className="text-xs text-danger-600">{error || '請稍後再試。'}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 prose max-w-none overflow-x-auto">
              {content ? (
                <MarkdownRenderer content={content} />
              ) : status === 'loading' ? (
                <div className="space-y-4">
                  {/* Skeleton Loader */}
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                    <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
                    <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
                    <div className="h-6 bg-neutral-300 rounded w-1/2 mt-4"></div>
                    <div className="h-4 bg-neutral-200 rounded w-4/5"></div>
                    <div className="h-4 bg-neutral-200 rounded w-3/5"></div>
                  </div>
                  
                  {/* Progress Indicator */}
                  <div className="mt-6 p-4 bg-info-50 rounded-lg border border-info-200">
                    <p className="text-sm font-medium text-info-700 mb-2">正在生成行銷分析…</p>
                    <div className="w-full h-2 bg-info-100 rounded-full overflow-hidden mb-2">
                      <div 
                        className="h-full bg-info-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, (loadingSeconds / 60) * 100)}%` }}
                      />
                    </div>
                    {showDelayNotice ? (
                      <p className="text-xs text-info-600">
                        DeepSeek V3.1 Terminus 深度思考中，請稍候或稍後回來查看結果...
                      </p>
                    ) : (
                      <p className="text-xs text-info-600">
                        預計需要 20-40 秒，DeepSeek 正在分析成分合規性與市場策略...
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-400 dark:text-white/55">按「開始分析」後，此處會顯示詳細的行銷策略與包裝建議。</p>
              )}
            </div>
          )}
          {status === 'loading' && (
            <span className="absolute bottom-0 left-0 w-2 h-5 bg-info-500/70 animate-pulse" />
          )}
        </div>
      </div>
    </Card>
  )
}

