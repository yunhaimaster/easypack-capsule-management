'use client'

import { useEffect, useState } from 'react'

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage?: number
  isOnline: boolean
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
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded-lg font-mono z-50">
      <div className="space-y-1">
        <div>載入時間: {metrics.loadTime.toFixed(0)}ms</div>
        {metrics.memoryUsage && (
          <div>內存使用: {metrics.memoryUsage}MB</div>
        )}
        <div className={`${metrics.isOnline ? 'text-green-400' : 'text-red-400'}`}>
          狀態: {metrics.isOnline ? '在線' : '離線'}
        </div>
      </div>
    </div>
  )
}
