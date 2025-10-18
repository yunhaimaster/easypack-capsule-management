'use client'

import React, { Suspense, ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { IconContainer } from '@/components/ui/icon-container'
import { Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SuspenseBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  errorFallback?: ReactNode
  className?: string
  loadingText?: string
}

function DefaultLoadingFallback({ loadingText = '載入中...', className }: { loadingText?: string; className?: string }) {
  return (
    <Card className={cn('liquid-glass-card', className)}>
      <CardContent className="liquid-glass-content p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <div className="absolute inset-0 rounded-full border-2 border-primary-200"></div>
          </div>
          <p className="text-neutral-600 text-sm font-medium">{loadingText}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function DefaultErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <Card className="liquid-glass-card border-danger-200 bg-danger-50">
      <CardContent className="liquid-glass-content p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <IconContainer icon={AlertCircle} variant="danger" size="lg" />
          <div className="text-center">
            <h3 className="text-danger-800 font-semibold mb-2">載入失敗</h3>
            <p className="text-danger-600 text-sm mb-4">
              {error.message || '發生未知錯誤，請稍後再試'}
            </p>
            <button
              onClick={resetErrorBoundary}
              className="px-4 py-2 bg-danger-500 text-white rounded-lg hover:bg-danger-600 transition-colors"
            >
              重試
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SuspenseBoundary({
  children,
  fallback,
  errorFallback,
  className,
  loadingText
}: SuspenseBoundaryProps) {
  return (
    <Suspense fallback={fallback || <DefaultLoadingFallback loadingText={loadingText} className={className} />}>
      {children}
    </Suspense>
  )
}

// Enhanced Error Boundary with React 19 features
export function ErrorBoundary({ 
  children, 
  fallback = DefaultErrorFallback,
  onError 
}: { 
  children: ReactNode
  fallback?: (props: { error: Error; resetErrorBoundary: () => void }) => ReactNode
  onError?: (error: Error, errorInfo: any) => void
}) {
  return (
    <ErrorBoundaryWrapper fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundaryWrapper>
  )
}

// Error Boundary Implementation
class ErrorBoundaryWrapper extends React.Component<
  {
    children: ReactNode
    fallback: (props: { error: Error; resetErrorBoundary: () => void }) => ReactNode
    onError?: (error: Error, errorInfo: any) => void
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: any) {
    this.props.onError?.(error, errorInfo)
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null })
  }

  override render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback({ 
        error: this.state.error, 
        resetErrorBoundary: this.resetErrorBoundary 
      })
    }

    return this.props.children
  }
}

// Streaming Suspense for progressive loading
export function StreamingSuspense({
  children,
  fallback,
  className
}: {
  children: ReactNode
  fallback?: ReactNode
  className?: string
}) {
  return (
    <SuspenseBoundary 
      fallback={fallback}
      className={className}
      loadingText="正在載入內容..."
    >
      {children}
    </SuspenseBoundary>
  )
}
