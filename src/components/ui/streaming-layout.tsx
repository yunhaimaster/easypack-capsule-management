'use client'

import React, { Suspense, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IconContainer } from '@/components/ui/icon-container'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StreamingSkeletonProps {
  className?: string
  lines?: number
}

export function StreamingSkeleton({ className, lines = 3 }: StreamingSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 bg-neutral-200 rounded animate-pulse",
            i === 0 && "w-3/4",
            i === 1 && "w-1/2",
            i === 2 && "w-5/6"
          )}
        />
      ))}
    </div>
  )
}

interface LoadingFallbackProps {
  message?: string
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}

export function LoadingFallback({ 
  message = "Loading...", 
  icon: Icon = Loader2,
  className 
}: LoadingFallbackProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="flex flex-col items-center justify-center p-6 text-center">
        <IconContainer className="mb-4 text-blue-500">
          <Icon className="h-8 w-8 animate-spin" />
        </IconContainer>
        <p className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
          {message}
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Please wait while we load the content...
        </p>
      </CardContent>
    </Card>
  )
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  className?: string
}

export function ErrorFallback({ error, resetError, className }: ErrorFallbackProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-center text-red-600">
          <IconContainer className="mr-2 text-red-500">
            <AlertCircle className="h-6 w-6" />
          </IconContainer>
          Loading Error
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-neutral-700 dark:text-neutral-300 mb-4">
          Sorry, we encountered an error while loading this content.
        </p>
        {error && (
          <details className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            <summary className="cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300">
              Error Details
            </summary>
            <pre className="mt-2 p-2 bg-neutral-100 dark:bg-neutral-800 rounded-md text-left overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
        <button
          onClick={resetError}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </CardContent>
    </Card>
  )
}

interface StreamingBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  errorFallback?: (props: { error: Error; resetError: () => void }) => ReactNode
  onError?: (error: Error, errorInfo: any) => void
  className?: string
}

export function StreamingBoundary({
  children,
  fallback,
  errorFallback,
  onError,
  className
}: StreamingBoundaryProps) {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  React.useEffect(() => {
    if (error && onError) {
      onError(error, { componentStack: '' })
    }
  }, [error, onError])

  if (error) {
    return errorFallback ? errorFallback({ error, resetError }) : (
      <ErrorFallback error={error} resetError={resetError} className={className} />
    )
  }

  return (
    <Suspense fallback={fallback || <LoadingFallback className={className} />}>
      {children}
    </Suspense>
  )
}

// Specialized streaming components for different content types
interface StreamingListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  loadingFallback?: ReactNode
  className?: string
}

export function StreamingList<T>({
  items,
  renderItem,
  loadingFallback,
  className
}: StreamingListProps<T>) {
  return (
    <StreamingBoundary
      fallback={loadingFallback || <StreamingSkeleton className={className} />}
      className={className}
    >
      <div className="space-y-2">
        {items.map((item, index) => (
          <Suspense key={index} fallback={<StreamingSkeleton lines={1} />}>
            {renderItem(item, index)}
          </Suspense>
        ))}
      </div>
    </StreamingBoundary>
  )
}

interface StreamingCardProps {
  title: string
  children: ReactNode
  loadingFallback?: ReactNode
  className?: string
}

export function StreamingCard({
  title,
  children,
  loadingFallback,
  className
}: StreamingCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <StreamingBoundary fallback={loadingFallback}>
          {children}
        </StreamingBoundary>
      </CardContent>
    </Card>
  )
}

// Example usage component for streaming data
interface StreamingDataProps {
  dataPromise: Promise<any>
  render: (data: any) => ReactNode
  loadingMessage?: string
  className?: string
}

export function StreamingData({
  dataPromise,
  render,
  loadingMessage,
  className
}: StreamingDataProps) {
  const data = React.use(dataPromise)

  return (
    <StreamingBoundary
      fallback={<LoadingFallback message={loadingMessage} className={className} />}
      className={className}
    >
      {render(data)}
    </StreamingBoundary>
  )
}

// Streaming layout for pages
interface StreamingPageLayoutProps {
  children: ReactNode
  header?: ReactNode
  sidebar?: ReactNode
  footer?: ReactNode
  className?: string
}

export function StreamingPageLayout({
  children,
  header,
  sidebar,
  footer,
  className
}: StreamingPageLayoutProps) {
  return (
    <div className={cn("min-h-screen flex flex-col", className)}>
      {/* Header - loads immediately */}
      {header && (
        <header className="bg-white shadow-sm border-b">
          {header}
        </header>
      )}

      <div className="flex flex-1">
        {/* Sidebar - streams in */}
        {sidebar && (
          <aside className="w-64 bg-neutral-50 border-r">
            <StreamingBoundary
              fallback={<StreamingSkeleton className="p-4" lines={8} />}
            >
              {sidebar}
            </StreamingBoundary>
          </aside>
        )}

        {/* Main content - streams in */}
        <main className="flex-1 p-6">
          <StreamingBoundary
            fallback={<LoadingFallback message="Loading page content..." />}
          >
            {children}
          </StreamingBoundary>
        </main>
      </div>

      {/* Footer - loads immediately */}
      {footer && (
        <footer className="bg-neutral-100 border-t">
          {footer}
        </footer>
      )}
    </div>
  )
}
