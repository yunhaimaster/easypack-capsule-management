'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { DateTime } from 'luxon'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { LiquidGlassFooter } from '@/components/ui/liquid-glass-footer'
import { fetchWithRetry, fetchParallel } from '@/lib/client-data-fetching'
import { formatDateOnly, formatNumber } from '@/lib/utils'
import { sumWorkUnits } from '@/lib/worklog'
import type { ProductionOrder, OrderWorklog, WorklogWithOrder } from '@/types'
import { Plus, FileText, ArrowRight, Calendar, Timer, ClipboardList, Clock3, Wand2, FlaskConical, Sparkles, CalendarDays, Download, Library, Clock } from 'lucide-react'
import { IconContainer } from '@/components/ui/icon-container'
import { SafeUpdateCard } from '@/components/home/update-card-safe'
import { UpdateToastNotifier } from '@/components/home/update-toast'
import { useAuth } from '@/components/auth/auth-provider'

const QUICK_CARD_PADDING = 'px-4 py-4 sm:px-6 sm:py-6'
const MINI_CARD_PADDING = 'px-3 sm:px-3.5 py-3'

const STATUS_PRIORITY: Record<'inProgress' | 'notStarted' | 'completed', number> = {
  inProgress: 0,
  notStarted: 1,
  completed: 2,
}

const ORDER_DISPLAY_LIMIT = 5
const WORKLOG_DISPLAY_LIMIT = 5

const getOrderStatus = (order: ProductionOrder) => {
  const hasWorklog = Array.isArray(order.worklogs) && order.worklogs.length > 0
  const completed = Boolean(order.completionDate)
  if (hasWorklog && !completed) return 'inProgress'
  if (!completed) return 'notStarted'
  return 'completed'
}

const getOrderDate = (order: ProductionOrder) => {
  const raw = order.completionDate ?? order.createdAt
  if (!raw) return DateTime.invalid('missing')
  if (raw instanceof Date) return DateTime.fromJSDate(raw, { zone: 'Asia/Hong_Kong' })
  return DateTime.fromISO(raw, { zone: 'Asia/Hong_Kong' })
}

const sortOrdersForHomepage = (orders: ProductionOrder[]) =>
  [...orders]
    .map((order) => ({
      ...order,
      worklogs: order.worklogs || [],
    }))
    .sort((a, b) => {
      const statusA = getOrderStatus(a)
      const statusB = getOrderStatus(b)
      if (statusA !== statusB) {
        return STATUS_PRIORITY[statusA] - STATUS_PRIORITY[statusB]
      }

      const dateA = getOrderDate(a)
      const dateB = getOrderDate(b)
      if (dateA.isValid && dateB.isValid) {
        return dateB.toMillis() - dateA.toMillis()
      }
      return 0
    })

const formatWorklogDate = (value: string) => {
  const date = DateTime.fromISO(value, { zone: 'Asia/Hong_Kong' })
  if (!date.isValid) return value
  return date.toFormat('yyyy/MM/dd (ccc)', { locale: 'zh-Hant' })
}

export function HomePageClient() {
  const router = useRouter()
  const { isManager, isAdmin } = useAuth()
  const [recentOrders, setRecentOrders] = useState<ProductionOrder[]>([])
  const [recentWorklogs, setRecentWorklogs] = useState<WorklogWithOrder[]>([])
  const [loading, setLoading] = useState(true)

  // Auth is now handled by middleware + AuthProvider - no client-side checks needed

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch both in parallel with optimized fetching
        // Fetch 30 orders to ensure we get good mix of statuses for client-side sorting
        const [ordersPayload, worklogsPayload] = await fetchParallel([
          `/api/orders?limit=30&sortBy=createdAt&sortOrder=desc`,
          `/api/worklogs?limit=${WORKLOG_DISPLAY_LIMIT}&sortOrder=desc`
        ])

        // Process orders - sort by status priority (進行中 > 未開始 > 已完成)
        if (ordersPayload?.success) {
          const orders = Array.isArray(ordersPayload.data?.orders) ? ordersPayload.data.orders : []
          setRecentOrders(sortOrdersForHomepage(orders).slice(0, ORDER_DISPLAY_LIMIT))
        }

        // Process worklogs
        if (worklogsPayload?.success) {
          const worklogs = Array.isArray(worklogsPayload.data?.worklogs) 
            ? worklogsPayload.data.worklogs.slice(0, WORKLOG_DISPLAY_LIMIT) 
            : []
          setRecentWorklogs(worklogs)
        }
      } catch (error) {
        console.error('載入首頁數據錯誤:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Auth check removed - handled by middleware

  return (
    <>
      <UpdateToastNotifier />
      <div className="min-h-screen logo-bg-animation flex flex-col">
        <LiquidGlassNav />

        <div className="pt-28 sm:pt-24 px-4 sm:px-6 md:px-8 space-y-8 floating-combined pb-14">
          {/* Page Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white/95">
              Easy Health 工作單營運中樞
            </h1>
            <p className="text-sm text-neutral-600 dark:text-white/75">
              工作單管理、膠囊生產與 AI 助手一站式平台
            </p>
          </div>

          {/* Update Card at Top (dismissible) */}
          <SafeUpdateCard position="top" compact={true} dismissible={true} />

        {/* Core Functions Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent flex-1" />
            <h2 className="text-sm font-semibold text-neutral-600 dark:text-white/75 uppercase tracking-wider">核心功能</h2>
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent flex-1" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="liquid-glass-card liquid-glass-card-interactive liquid-glass-card-refraction floating-orbs group">
              <div className="liquid-glass-content flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                  <IconContainer icon={ClipboardList} variant="primary" size="md" />
                  <div className="text-right space-y-1">
                    <h3 className="text-sm font-semibold text-primary-600">工作單總覽</h3>
                    <p className="text-xs text-primary-500/70">查看所有工作單</p>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 dark:text-white/75 leading-relaxed">
                  查看所有工作單，包含生產、包裝、倉務等各類工作任務。
                </p>
                <div className="mt-auto">
                  <Button asChild size="sm" className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 transition-all duration-300">
                    <Link href="/work-orders">查看工作單</Link>
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="liquid-glass-card liquid-glass-card-interactive liquid-glass-card-refraction floating-particles group">
              <div className="liquid-glass-content flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                  <IconContainer icon={Calendar} variant="info" size="md" />
                  <div className="text-right space-y-1">
                    <h3 className="text-sm font-semibold text-info-600">經理排單表</h3>
                    <p className="text-xs text-info-500/70">管理生產優先順序</p>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 dark:text-white/75 leading-relaxed">
                  管理膠囊生產工作單的優先順序和生產計劃，拖放排序與即時同步。
                </p>
                <div className="mt-auto">
                  <Button asChild size="sm" className="w-full bg-gradient-to-r from-info-500 to-info-600 hover:from-info-600 hover:to-info-700 transition-all duration-300">
                    <Link href="/manager-scheduling">排單表</Link>
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="liquid-glass-card liquid-glass-card-interactive liquid-glass-card-refraction floating-orbs group">
              <div className="liquid-glass-content flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                  <IconContainer icon={FileText} variant="primary" size="md" />
                  <div className="text-right space-y-1">
                    <h3 className="text-sm font-semibold text-primary-600">查看膠囊訂單</h3>
                    <p className="text-xs text-primary-500/70">管理所有生產訂單</p>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 dark:text-white/75 leading-relaxed">
                  查看、搜尋和管理所有膠囊生產訂單，追蹤訂單狀態與生產進度。
                </p>
                <div className="mt-auto">
                  <Button asChild size="sm" className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 transition-all duration-300">
                    <Link href="/orders">查看訂單</Link>
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="liquid-glass-card liquid-glass-card-interactive liquid-glass-card-refraction floating-particles group">
              <div className="liquid-glass-content flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                  <IconContainer icon={Clock} variant="warning" size="md" />
                  <div className="text-right space-y-1">
                    <h3 className="text-sm font-semibold text-warning-600">工時記錄</h3>
                    <p className="text-xs text-warning-500/70">記錄生產工時</p>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 dark:text-white/75 leading-relaxed">
                  記錄生產工時，追蹤工作進度與效率分析。
                </p>
                <div className="mt-auto">
                  <Button asChild size="sm" className="w-full bg-gradient-to-r from-warning-500 to-warning-600 hover:from-warning-600 hover:to-warning-700 transition-all duration-300">
                    <Link href="/worklogs">工時記錄</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Auxiliary Tools Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent flex-1" />
            <h2 className="text-sm font-semibold text-neutral-600 dark:text-white/75 uppercase tracking-wider">輔助工具</h2>
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent flex-1" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="liquid-glass-card liquid-glass-card-interactive liquid-glass-card-refraction floating-orbs group">
              <div className="liquid-glass-content flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                  <IconContainer icon={Library} variant="info" size="md" />
                  <div className="text-right space-y-1">
                    <h3 className="text-sm font-semibold text-info-600">配方庫</h3>
                    <p className="text-xs text-info-500/70">歷史配方、備註、AI 功效一次到位</p>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 dark:text-white/75 leading-relaxed">
                  瀏覽歷史膠囊配方，保留製程問題與品管備註，並可手動觸發 AI 功效分析。
                </p>
                <div className="mt-auto">
                  <Button asChild size="sm" className="w-full bg-gradient-to-r from-info-500 to-info-600 hover:from-info-600 hover:to-info-700 transition-all duration-300">
                    <Link href="/recipe-library">瀏覽配方庫</Link>
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="liquid-glass-card liquid-glass-card-interactive liquid-glass-card-refraction floating-orbs group">
              <div className="liquid-glass-content flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                  <IconContainer icon={Sparkles} variant="secondary" size="md" />
                  <div className="text-right space-y-1">
                    <h3 className="text-sm font-semibold text-secondary-600">AI 工具箱</h3>
                    <p className="text-xs text-secondary-500/70">智能助手加速行銷與生產分析</p>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 dark:text-white/75 leading-relaxed">
                  多種 AI 工具協助配方生成、製粒分析與行銷設計。
                </p>
                <div className="mt-auto space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <Button asChild size="sm" variant="outline" className="text-xs hover:bg-secondary-50 hover:border-secondary-300 transition-all duration-300">
                      <Link href="/marketing-assistant">行銷助手</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="text-xs hover:bg-secondary-50 hover:border-secondary-300 transition-all duration-300">
                      <Link href="/granulation-analyzer">製粒分析</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="text-xs hover:bg-secondary-50 hover:border-secondary-300 transition-all duration-300">
                      <Link href="/ai-recipe-generator">配方生成</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

          {/* Fallback: Update Card at Bottom (if dismissed from top) */}
          <SafeUpdateCard position="bottom" compact={false} dismissible={false} />
        </div>

        <LiquidGlassFooter />
      </div>
    </>
  )
}