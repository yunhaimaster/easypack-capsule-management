'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { Sparkles, Copy, RefreshCw, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

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
  idle: 'bg-slate-500/10 border border-slate-300/40 text-neutral-600',
  loading: 'bg-primary-500/15 border border-primary-300/40 text-primary-700',
  success: 'bg-success-500/15 border border-emerald-300/40 text-success-700',
  error: 'bg-danger-500/15 border border-red-300/40 text-red-700'
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

  return (
    <Card className="liquid-glass-card liquid-glass-card-elevated" interactive={false}>
      <div className="liquid-glass-content">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="icon-container icon-container-violet">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-800">行銷策略分析</h2>
              <p className="text-sm text-neutral-500">DeepSeek Chat v3.1 專業行銷建議與包裝設計方案</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {duration && (
              <span className="inline-flex items-center gap-1 text-xs text-neutral-500 bg-white/70 px-2.5 py-1 rounded-full">
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
                DeepSeek Chat v3.1 深度思考中…
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

        <div className="relative">
          {status === 'error' ? (
            <div className="flex items-start gap-3 p-4 rounded-lg border border-red-200 bg-danger-50 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">分析失敗</p>
                <p className="text-xs text-red-600">{error || '請稍後再試。'}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 prose max-w-none overflow-x-auto">
              {content ? (
                <MarkdownRenderer content={content} />
              ) : status === 'loading' ? (
                <>
                  <p className="text-sm text-neutral-500">正在生成行銷分析…</p>
                  <div className="w-full h-2 bg-gray-200/60 rounded-full overflow-hidden">
                    <div className="h-full bg-info-500/70 animate-pulse" style={{ width: `${Math.min(100, (loadingSeconds / 60) * 100)}%` }} />
                  </div>
                  {showDelayNotice ? (
                    <p className="text-xs text-neutral-400">
                      GPT-5 需要較長時間整理詳細內容，請稍候或稍後回來查看結果。
                    </p>
                  ) : (
                    <p className="text-xs text-neutral-400">通常需要 20-40 秒完成，請稍候。</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-neutral-400">按「開始分析」後，此處會顯示詳細的行銷策略與包裝建議。</p>
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

