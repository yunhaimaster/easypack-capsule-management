'use client'

import { useState, useEffect } from 'react'
import { Brain, Loader2 } from 'lucide-react'

interface AIThinkingIndicatorProps {
  isThinking: boolean
  enableReasoning?: boolean
}

export function AIThinkingIndicator({ isThinking, enableReasoning = false }: AIThinkingIndicatorProps) {
  const [dots, setDots] = useState('')
  
  useEffect(() => {
    if (!isThinking) {
      setDots('')
      return
    }

    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)

    return () => clearInterval(interval)
  }, [isThinking])

  if (!isThinking) return null

  return (
    <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-xl border border-neutral-200">
      <div className="flex-shrink-0">
        {enableReasoning ? (
          <div className="relative">
            <Brain className="w-6 h-6 text-primary-600 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-warning-400 rounded-full animate-ping" />
          </div>
        ) : (
          <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <h4 className="font-medium text-neutral-900 dark:text-white/95">
            {enableReasoning ? 'AI 深度思考中' : 'AI 正在處理'}
          </h4>
          <span className="text-neutral-600 dark:text-white/75 text-sm">
            {enableReasoning ? '深度推理模式' : '快速響應模式'}
          </span>
        </div>
        <p className="text-sm text-neutral-700 dark:text-white/85 mt-1">
          {enableReasoning ? (
            <>
              AI 正在進行深度分析與推理
              <span className="inline-block w-2 ml-1">{dots}</span>
              <br />
              <span className="text-xs text-primary-600">
                這可能需要更長時間，但會提供更深入的分析
              </span>
            </>
          ) : (
            <>
              正在生成回答
              <span className="inline-block w-2 ml-1">{dots}</span>
            </>
          )}
        </p>
      </div>
      {enableReasoning && (
        <div className="flex-shrink-0">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  )
}

interface AIThinkingStepsProps {
  isThinking: boolean
  enableReasoning?: boolean
}

export function AIThinkingSteps({ isThinking, enableReasoning = false }: AIThinkingStepsProps) {
  const [currentStep, setCurrentStep] = useState(0)
  
  const steps = enableReasoning ? [
    '分析問題核心',
    '檢索相關知識',
    '進行邏輯推理',
    '評估多種方案',
    '生成詳細回答',
    '質量檢查與優化'
  ] : [
    '理解問題',
    '檢索資料',
    '生成回答'
  ]

  useEffect(() => {
    if (!isThinking) {
      setCurrentStep(0)
      return
    }

    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length)
    }, enableReasoning ? 2000 : 1000)

    return () => clearInterval(interval)
  }, [isThinking, enableReasoning, steps.length])

  if (!isThinking) return null

  return (
    <div className="bg-gradient-to-r from-info-50 to-primary-50 rounded-xl border border-info-200 p-4">
      <div className="flex items-center space-x-3 mb-3">
        <Brain className="w-5 h-5 text-info-600 animate-pulse" />
        <h4 className="font-medium text-info-900">
          {enableReasoning ? '深度推理進程' : '處理進程'}
        </h4>
      </div>
      
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center space-x-3 transition-all duration-300 ${
              index <= currentStep ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                index < currentStep
                  ? 'bg-success-500 text-white'
                  : index === currentStep
                  ? 'bg-primary-500 text-white animate-pulse'
                  : 'bg-neutral-300 text-neutral-600 dark:text-white/75'
              }`}
            >
              {index < currentStep ? '✓' : index + 1}
            </div>
            <span
              className={`text-sm transition-all duration-300 ${
                index <= currentStep ? 'text-neutral-900 dark:text-white/95 font-medium' : 'text-neutral-500 dark:text-white/65'
              }`}
            >
              {step}
            </span>
            {index === currentStep && (
              <div className="flex space-x-1 ml-auto">
                <div className="w-1 h-1 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-1 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {enableReasoning && (
        <div className="mt-3 p-2 bg-warning-50 rounded-lg border border-warning-200">
          <p className="text-xs text-warning-800">
            💡 深度推理模式會提供更全面和準確的分析，但需要更多時間
          </p>
        </div>
      )}
    </div>
  )
}
