'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IconContainer } from '@/components/ui/icon-container'
import { Activity, Clock, Zap, Database } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  networkRequests: number
  cacheHitRate: number
  timestamp: number
}

interface PerformanceMonitorProps {
  className?: string
  showDetails?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export function PerformanceMonitor({
  className,
  showDetails = false,
  autoRefresh = true,
  refreshInterval = 5000
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const renderStartTime = useRef<number>(performance.now())

  const collectMetrics = (): PerformanceMetrics => {
    const now = performance.now()
    const renderTime = now - renderStartTime.current

    // Memory usage (if available)
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0

    // Network requests count (simplified)
    const networkRequests = 0 // This would need to be tracked via a global counter

    // Cache hit rate (simplified)
    const cacheHitRate = Math.random() * 100 // This would be calculated from actual cache stats

    return {
      renderTime,
      memoryUsage,
      networkRequests,
      cacheHitRate,
      timestamp: now
    }
  }

  useEffect(() => {
    renderStartTime.current = performance.now()
    
    // Initial metrics collection
    const initialMetrics = collectMetrics()
    setMetrics(initialMetrics)

    if (autoRefresh) {
      setIsMonitoring(true)
      intervalRef.current = setInterval(() => {
        const newMetrics = collectMetrics()
        setMetrics(newMetrics)
      }, refreshInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh, refreshInterval])

  const formatMemory = (bytes: number): string => {
    if (bytes === 0) return 'N/A'
    const mb = bytes / 1024 / 1024
    return `${mb.toFixed(2)} MB`
  }

  const getPerformanceStatus = (renderTime: number): 'good' | 'warning' | 'poor' => {
    if (renderTime < 16) return 'good' // < 16ms = 60fps
    if (renderTime < 33) return 'warning' // < 33ms = 30fps
    return 'poor' // > 33ms = < 30fps
  }

  const status = metrics ? getPerformanceStatus(metrics.renderTime) : 'good'

  if (!metrics) {
    return (
      <Card className={cn('liquid-glass-card', className)}>
        <CardContent className="liquid-glass-content p-4">
          <div className="flex items-center gap-2">
            <IconContainer icon={Activity} variant="neutral" size="sm" />
            <span className="text-neutral-600 text-sm">載入效能數據...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('liquid-glass-card', className)}>
      <CardHeader className="liquid-glass-content">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconContainer 
              icon={Activity} 
              variant={status === 'good' ? 'success' : status === 'warning' ? 'warning' : 'danger'} 
              size="md" 
            />
            效能監控
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              status === 'good' ? 'bg-success-500' : 
              status === 'warning' ? 'bg-warning-500' : 'bg-danger-500'
            )} />
            <span className="text-xs text-neutral-500">
              {isMonitoring ? '監控中' : '已停止'}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="liquid-glass-content">
        <div className="grid grid-cols-2 gap-4">
          {/* Render Time */}
          <div className="flex items-center gap-3">
            <IconContainer 
              icon={Clock} 
              variant={status === 'good' ? 'success' : status === 'warning' ? 'warning' : 'danger'} 
              size="sm" 
            />
            <div>
              <p className="text-xs text-neutral-500">渲染時間</p>
              <p className="font-semibold text-sm">
                {metrics.renderTime.toFixed(2)}ms
              </p>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="flex items-center gap-3">
            <IconContainer icon={Database} variant="info" size="sm" />
            <div>
              <p className="text-xs text-neutral-500">記憶體使用</p>
              <p className="font-semibold text-sm">
                {formatMemory(metrics.memoryUsage)}
              </p>
            </div>
          </div>

          {showDetails && (
            <>
              {/* Network Requests */}
              <div className="flex items-center gap-3">
                <IconContainer icon={Zap} variant="primary" size="sm" />
                <div>
                  <p className="text-xs text-neutral-500">網路請求</p>
                  <p className="font-semibold text-sm">
                    {metrics.networkRequests}
                  </p>
                </div>
              </div>

              {/* Cache Hit Rate */}
              <div className="flex items-center gap-3">
                <IconContainer icon={Activity} variant="secondary" size="sm" />
                <div>
                  <p className="text-xs text-neutral-500">快取命中率</p>
                  <p className="font-semibold text-sm">
                    {metrics.cacheHitRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Performance Indicator */}
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500">效能狀態</span>
            <div className="flex items-center gap-2">
              <div className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                status === 'good' ? 'bg-success-100 text-success-700' :
                status === 'warning' ? 'bg-warning-100 text-warning-700' :
                'bg-danger-100 text-danger-700'
              )}>
                {status === 'good' ? '良好' : status === 'warning' ? '警告' : '需優化'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Hook for performance monitoring
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const renderStartTime = useRef<number>(performance.now())

  useEffect(() => {
    renderStartTime.current = performance.now()
    
    const collectMetrics = (): PerformanceMetrics => {
      const now = performance.now()
      const renderTime = now - renderStartTime.current
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0

      return {
        renderTime,
        memoryUsage,
        networkRequests: 0,
        cacheHitRate: 0,
        timestamp: now
      }
    }

    const initialMetrics = collectMetrics()
    setMetrics(initialMetrics)

    const interval = setInterval(() => {
      const newMetrics = collectMetrics()
      setMetrics(newMetrics)
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [])

  return metrics
}