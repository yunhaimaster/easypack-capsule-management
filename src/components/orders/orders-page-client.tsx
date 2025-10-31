'use client'

import { useEffect, useState } from 'react'
import { ResponsiveOrdersList } from '@/components/orders/responsive-orders-list'
import { SmartAIAssistant } from '@/components/ai/smart-ai-assistant'
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { LiquidGlassFooter } from '@/components/ui/liquid-glass-footer'
import { IconContainer } from '@/components/ui/icon-container'
import { fetchWithRetry } from '@/lib/client-data-fetching'
import { Users } from 'lucide-react'
import Link from 'next/link'

export function OrdersPageClient() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)

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

    fetchOrdersForAI()
  }, [])

  return (
    <div className="min-h-screen logo-bg-animation flex flex-col">
      <LiquidGlassNav />
      <div className="pt-28 sm:pt-24 px-4 sm:px-6 md:px-8 space-y-8 floating-combined">
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
              <span className="px-3.5 py-1.5 rounded-full bg-success-500/15 border border-success-300/40 text-success-700 text-sm font-medium leading-none">即時更新</span>
              <span className="px-3.5 py-1.5 rounded-full bg-primary-500/15 border border-primary-300/40 text-primary-700 text-sm font-medium leading-none">資料匯出</span>
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
