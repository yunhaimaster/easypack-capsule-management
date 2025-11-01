'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ResponsiveOrdersList } from '@/components/orders/responsive-orders-list'
import { SmartAIAssistant } from '@/components/ai/smart-ai-assistant'
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { LiquidGlassFooter } from '@/components/ui/liquid-glass-footer'
import { IconContainer } from '@/components/ui/icon-container'
import { fetchWithRetry } from '@/lib/client-data-fetching'
import { Users } from 'lucide-react'
import Link from 'next/link'

interface OrderStats {
  total: number
  completed: number
  inProgress: number
  notStarted: number
}

export function OrdersPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  
  // Handle stats badge click to filter orders
  const handleStatClick = (type: 'total' | 'completed' | 'inProgress' | 'notStarted') => {
    const params = new URLSearchParams(searchParams?.toString())
    
    // Reset to page 1
    params.set('page', '1')
    
    // Clear status-related filters first
    params.delete('isCompleted')
    params.delete('status')
    
    switch (type) {
      case 'total':
        // Show all orders - clear all filters
        params.delete('isCompleted')
        params.delete('status')
        break
      case 'completed':
        // Show completed orders (completionDate is not null)
        params.set('isCompleted', 'true')
        break
      case 'inProgress':
        // Show in progress orders (status = IN_PROGRESS)
        params.set('status', 'IN_PROGRESS')
        params.delete('isCompleted')
        break
      case 'notStarted':
        // Show not started orders (status = NOT_STARTED)
        params.set('status', 'NOT_STARTED')
        params.delete('isCompleted')
        break
    }
    
    router.push(`/orders?${params.toString()}`)
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })

    const fetchOrdersForAI = async () => {
      try {
        setIsLoading(true)
        const payload = await fetchWithRetry('/api/orders?limit=100', {
          retries: 2,
          retryDelay: 500
        })
        setOrders(Array.isArray(payload?.data?.orders) ? payload.data.orders : payload.orders || [])
      } catch (error) {
        console.error('Error fetching orders for AI:', error)
        setOrders([])
      } finally {
        setIsLoading(false)
      }
    }

    const fetchStats = async () => {
      try {
        setIsLoadingStats(true)
        const response = await fetch('/api/orders/stats')
        const data = await response.json()
        if (data.success && data.data) {
          setStats(data.data)
        }
      } catch (error) {
        console.error('Error fetching order statistics:', error)
        setStats(null)
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchOrdersForAI()
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen logo-bg-animation flex flex-col">
      <LiquidGlassNav />
      <div className="page-content-padding-top px-4 sm:px-6 md:px-8 space-y-8 floating-combined">
        <section className="liquid-glass-card liquid-glass-card-refraction liquid-glass-card-interactive p-6 md:p-8">
          <div className="liquid-glass-content flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <IconContainer icon={Users} variant="secondary" size="md" className="shadow-[0_12px_30px_rgba(34,211,238,0.25)]" />
              <div>
                <h1 className="text-lg md:text-lg font-semibold text-neutral-800 dark:text-white/95 tracking-tight">膠囊訂單管理（工作單子訂單）</h1>
                <p className="text-xs md:text-xs text-neutral-600 dark:text-white/75">管理屬於工作單的膠囊生產訂單，包含狀態追蹤、搜尋篩選與匯出報表</p>
                <p className="text-xs md:text-xs text-neutral-500 dark:text-white/60 mt-1">此列表顯示膠囊訂單，每個訂單都屬於一個工作單</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              {/* Statistics Badges */}
              {isLoadingStats ? (
                <span className="px-3.5 py-1.5 rounded-full bg-neutral-500/15 border border-neutral-300/40 text-neutral-700 dark:text-neutral-300 text-xs font-medium leading-none">載入中...</span>
              ) : stats ? (
                <>
                  <button
                    onClick={() => handleStatClick('total')}
                    className="px-3.5 py-1.5 rounded-full bg-primary-500/15 border border-primary-300/40 text-primary-700 dark:text-primary-400 text-xs font-medium leading-none hover:bg-primary-500/25 transition-apple cursor-pointer touch-feedback"
                    title="點擊查看所有訂單"
                  >
                    總計: {stats.total}
                  </button>
                  <button
                    onClick={() => handleStatClick('completed')}
                    className="px-3.5 py-1.5 rounded-full bg-success-500/15 border border-success-300/40 text-success-700 dark:text-success-400 text-xs font-medium leading-none hover:bg-success-500/25 transition-apple cursor-pointer touch-feedback"
                    title="點擊查看已完成的訂單"
                  >
                    完成: {stats.completed}
                  </button>
                  <button
                    onClick={() => handleStatClick('inProgress')}
                    className="px-3.5 py-1.5 rounded-full bg-warning-500/15 border border-warning-300/40 text-warning-700 dark:text-warning-400 text-xs font-medium leading-none hover:bg-warning-500/25 transition-apple cursor-pointer touch-feedback"
                    title="點擊查看進行中的訂單"
                  >
                    進行中: {stats.inProgress}
                  </button>
                  <button
                    onClick={() => handleStatClick('notStarted')}
                    className="px-3.5 py-1.5 rounded-full bg-neutral-500/15 border border-neutral-300/40 text-neutral-700 dark:text-neutral-300 text-xs font-medium leading-none hover:bg-neutral-500/25 transition-apple cursor-pointer touch-feedback"
                    title="點擊查看未開始的訂單"
                  >
                    未開始: {stats.notStarted}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </section>

        <ResponsiveOrdersList />
        <SmartAIAssistant
          orders={orders}
          pageData={{
            currentPage: '/orders',
            pageDescription: '生產記錄管理頁面 - 查看和管理所有膠囊生產訂單（每個訂單都屬於一個工作單）',
            timestamp: new Date().toISOString(),
            ordersCount: orders.length,
            hasCurrentOrder: false,
            currentOrder: null,
            recentOrders: orders.slice(0, 5),
          }}
        />
        <div className="flex justify-end">
          <Link href="/orders/new" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            + 新建訂單
          </Link>
        </div>
      </div>
      <LiquidGlassFooter />
    </div>
  )
}
