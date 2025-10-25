'use client'

import { useState, useEffect } from 'react'
import { Brain, ChevronDown, ChevronUp } from 'lucide-react'

interface AIRealReasoningProps {
  reasoning?: string
  enableReasoning?: boolean
}

export function AIRealReasoning({ reasoning, enableReasoning = false }: AIRealReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [displayText, setDisplayText] = useState('')
  
  useEffect(() => {
    if (!reasoning) {
      setDisplayText('')
      return
    }

    // 直接顯示完整的思考過程，不需要打字機效果
    setDisplayText(reasoning)
  }, [reasoning])

  if (!enableReasoning || !reasoning) return null

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-4 mb-3">
      <div 
        className="flex items-center space-x-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-shrink-0">
          <Brain className="w-5 h-5 text-purple-600 animate-pulse" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-purple-900">
            AI 思考過程
          </h4>
          <p className="text-sm text-purple-600">
            {isExpanded ? '點擊收起' : '點擊查看思考步驟'}
          </p>
        </div>
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-purple-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-purple-600" />
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-purple-200">
          <div className="bg-surface-primary/50 rounded-lg p-3 max-h-64 overflow-y-auto">
            <div className="text-sm text-neutral-800 dark:text-white/95 whitespace-pre-wrap font-mono leading-relaxed">
              {displayText}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface AIReasoningIndicatorProps {
  isReasoning: boolean
  enableReasoning?: boolean
}

export function AIReasoningIndicator({ isReasoning, enableReasoning = false }: AIReasoningIndicatorProps) {
  if (!isReasoning || !enableReasoning) return null

  return (
    <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800/30 mb-3">
      <div className="flex-shrink-0">
        <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400 animate-pulse" />
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <h4 className="font-medium text-purple-900 dark:text-purple-200">
            AI 深度思考中
          </h4>
          <span className="text-purple-600 dark:text-purple-400 text-sm">
            推理模式
          </span>
        </div>
        <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
          AI 正在進行深度分析和推理，這可能需要更長時間
        </p>
      </div>
      <div className="flex-shrink-0">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-purple-400 dark:bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-purple-400 dark:bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-purple-400 dark:bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
