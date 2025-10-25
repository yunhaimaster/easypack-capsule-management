'use client'

import { Badge } from '@/components/ui/badge'
import { Sparkles, Zap } from 'lucide-react'

interface AIPoweredBadgeProps {
  variant?: 'default' | 'compact' | 'minimal'
  showIcon?: boolean
  className?: string
}

export function AIPoweredBadge({ 
  variant = 'default', 
  showIcon = true,
  className = '' 
}: AIPoweredBadgeProps) {
  if (variant === 'minimal') {
    return (
      <div className={`inline-flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
        {showIcon && <Sparkles className="w-3 h-3" />}
        <span>AI 驅動</span>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <Badge 
        variant="outline" 
        className={`inline-flex items-center gap-1 text-xs bg-gradient-to-r from-primary-50 to-info-50 border-primary-200 text-primary-700 ${className}`}
      >
        {showIcon && <Zap className="w-3 h-3" />}
        <span>Powered by Multiple AI Models</span>
      </Badge>
    )
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-50 to-info-50 border border-primary-200 ${className}`}>
      {showIcon && (
        <div className="flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-primary-600" />
          <Zap className="w-3 h-3 text-info-600" />
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-xs font-medium text-primary-800">
          Powered by AI
        </span>
        <span className="text-xs text-primary-600">
          GPT-5 · Claude · Grok
        </span>
      </div>
    </div>
  )
}
