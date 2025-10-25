'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2, XCircle, Circle, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalysisStatusBadgeProps {
  status: 'analyzed' | 'analyzing' | 'failed' | 'not-analyzed'
  onRetry?: () => void
  className?: string
}

export function AnalysisStatusBadge({ status, onRetry, className }: AnalysisStatusBadgeProps) {
  if (status === 'analyzed') {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "flex items-center gap-1.5 bg-success-50 text-success-700 border-success-200",
          className
        )}
      >
        <CheckCircle className="h-3 w-3" />
        <span className="text-xs">已分析</span>
      </Badge>
    )
  }

  if (status === 'analyzing') {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "flex items-center gap-1.5 bg-warning-50 text-warning-700 border-warning-200",
          className
        )}
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs">分析中...</span>
      </Badge>
    )
  }

  if (status === 'failed') {
    return (
      <div className="flex items-center gap-1.5">
        <Badge 
          variant="outline" 
          className={cn(
            "flex items-center gap-1.5 bg-danger-50 text-danger-700 border-danger-200",
            className
          )}
        >
          <XCircle className="h-3 w-3" />
          <span className="text-xs">分析失敗</span>
        </Badge>
        {onRetry && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onRetry()
            }}
            className="h-6 w-6 p-0"
            title="重試"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  // not-analyzed
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "flex items-center gap-1.5 bg-neutral-50 text-neutral-600 dark:text-white/75 border-neutral-200",
        className
      )}
    >
      <Circle className="h-3 w-3" />
      <span className="text-xs">未分析</span>
    </Badge>
  )
}

