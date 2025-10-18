'use client'

import { useEffect, useState } from 'react'

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage?: number
  isOnline: boolean
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    isOnline: navigator.onLine
  })

  useEffect(() => {
    // 監控頁面載入時間
    const loadTime = performance.now()
    setMetrics(prev => ({ ...prev, loadTime }))

    // 監控 Core Web Vitals
    if ('PerformanceObserver' in window) {
      // First Contentful Paint
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            setMetrics(prev => ({ ...prev, fcp: entry.startTime }))
          }
        }
      }).observe({ entryTypes: ['paint'] })

      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }))
      }).observe({ entryTypes: ['largest-contentful-paint'] })

      // First Input Delay
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as any
          setMetrics(prev => ({ ...prev, fid: fidEntry.processingStart - entry.startTime }))
        }
      }).observe({ entryTypes: ['first-input'] })

      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        let clsValue = 0
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        setMetrics(prev => ({ ...prev, cls: clsValue }))
      }).observe({ entryTypes: ['layout-shift'] })
    }

    // Time to First Byte
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigationEntry) {
      setMetrics(prev => ({ ...prev, ttfb: navigationEntry.responseStart - navigationEntry.requestStart }))
    }

    // 監控在線狀態
    const handleOnline = () => setMetrics(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setMetrics(prev => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 監控內存使用（如果支持）
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory
      const updateMemoryUsage = () => {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) // MB
        }))
      }
      
      updateMemoryUsage()
      const memoryInterval = setInterval(updateMemoryUsage, 5000)
      
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
        clearInterval(memoryInterval)
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 在開發環境下顯示性能指標
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white text-xs p-3 rounded-lg font-mono z-50 max-w-xs">
      <div className="space-y-1">
        <div className="font-bold text-blue-400 mb-2">Performance Monitor</div>
        <div>載入時間: {metrics.loadTime.toFixed(0)}ms</div>
        {metrics.fcp && <div>FCP: {metrics.fcp.toFixed(0)}ms</div>}
        {metrics.lcp && <div>LCP: {metrics.lcp.toFixed(0)}ms</div>}
        {metrics.fid && <div>FID: {metrics.fid.toFixed(0)}ms</div>}
        {metrics.cls && <div>CLS: {metrics.cls.toFixed(3)}</div>}
        {metrics.ttfb && <div>TTFB: {metrics.ttfb.toFixed(0)}ms</div>}
        {metrics.memoryUsage && (
          <div>內存: {metrics.memoryUsage}MB</div>
        )}
        <div className={`${metrics.isOnline ? 'text-green-400' : 'text-red-400'}`}>
          狀態: {metrics.isOnline ? '在線' : '離線'}
        </div>
      </div>
    </div>
  )
}
