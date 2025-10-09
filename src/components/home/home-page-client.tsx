'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { DateTime } from 'luxon'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { LiquidGlassFooter } from '@/components/ui/liquid-glass-footer'
import { fetchWithTimeout } from '@/lib/api-client'
import { formatDateOnly, formatNumber } from '@/lib/utils'
import { sumWorkUnits } from '@/lib/worklog'
import type { ProductionOrder, OrderWorklog, WorklogWithOrder } from '@/types'
import { Plus, FileText, ArrowRight, Calendar, Timer, ClipboardList, Clock3, Wand2, FlaskConical, ClipboardCheck, CalendarDays, Download } from 'lucide-react'

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
  const [recentOrders, setRecentOrders] = useState<ProductionOrder[]>([])
  const [recentWorklogs, setRecentWorklogs] = useState<WorklogWithOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated')
    const easypackAuth = localStorage.getItem('easypack_auth')
    if (authStatus !== 'true' && easypackAuth !== 'true') {
      router.push('/login')
      return
    }
    setIsAuthenticated(true)
  }, [router])

  const fetchRecentOrders = useCallback(async () => {
    try {
      // Fetch more orders to ensure we get the right mix of statuses before sorting
      const response = await fetchWithTimeout(`/api/orders?limit=50&sortBy=createdAt&sortOrder=desc`)
      if (!response.ok) return
      const payload = await response.json()
      if (!payload?.success) return
      const orders = Array.isArray(payload.data?.orders) ? payload.data.orders : []
      // Apply status-based sorting and take top 5
      setRecentOrders(sortOrdersForHomepage(orders).slice(0, ORDER_DISPLAY_LIMIT))
    } catch (error) {
      console.error('載入最近訂單錯誤:', error)
    }
  }, [])

  const fetchRecentWorklogs = useCallback(async () => {
    try {
      const response = await fetchWithTimeout(`/api/worklogs?limit=${WORKLOG_DISPLAY_LIMIT}&sortOrder=desc`)
      if (!response.ok) return
      const payload = await response.json()
      if (!payload?.success) return
      setRecentWorklogs(Array.isArray(payload.data?.worklogs) ? payload.data.worklogs.slice(0, WORKLOG_DISPLAY_LIMIT) : [])
    } catch (error) {
      console.error('載入最近工時錯誤:', error)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all([fetchRecentOrders(), fetchRecentWorklogs()])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [fetchRecentOrders, fetchRecentWorklogs])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">驗證中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen logo-bg-animation flex flex-col">
      <LiquidGlassNav />

      <div className="pt-28 sm:pt-24 px-4 sm:px-6 md:px-8 space-y-6 floating-combined pb-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className={`liquid-glass-card liquid-glass-card-brand liquid-glass-card-interactive liquid-glass-card-refraction floating-shapes group ${QUICK_CARD_PADDING}`}>
            <div className="liquid-glass-content flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="icon-container icon-container-gradient-sunrise icon-micro-bounce">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div className="text-right space-y-1">
                  <h3 className="text-sm font-semibold text-indigo-600">新增配方</h3>
                  <p className="text-xs text-indigo-500/75">快速建立新配方記錄</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                建立新的膠囊配方記錄，包含原料配置與生產參數。
              </p>
              <div className="mt-auto">
                <Button asChild size="sm" className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:brightness-110">
                  <Link href="/orders/new">開始建立</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className={`liquid-glass-card liquid-glass-card-interactive liquid-glass-card-refraction floating-orbs group ${QUICK_CARD_PADDING}`}>
            <div className="liquid-glass-content flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="icon-container icon-container-gradient-emerald icon-micro-bounce">
                  <ClipboardList className="h-5 w-5 text-white" />
                </div>
                <div className="text-right space-y-1">
                  <h3 className="text-sm font-semibold text-emerald-600">生產記錄</h3>
                  <p className="text-xs text-emerald-500/70">支援搜尋篩選與編輯</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                檢視與管理所有生產訂單，掌握最新工時與進度。
              </p>
              <div className="mt-auto">
                <Button asChild size="sm" className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110">
                  <Link href="/orders">查看記錄</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <div className={`rounded-2xl bg-white/65 border border-white/75 shadow-[0_4px_12px_rgba(15,32,77,0.1)] ${MINI_CARD_PADDING} space-y-3`}>
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-500" />最近生產紀錄
                </h3>
                <p className="text-[11px] text-slate-500">最新 5 筆訂單</p>
              </div>
              <Link href="/orders" className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                查看全部<ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2.5">
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-5/6" />
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-2">
                {recentOrders.map((order) => {
                  const status = getOrderStatus(order)
                  const statusLabel = status === 'completed' ? '已完成' : status === 'inProgress' ? '進行中' : '未開始'
                  const latestWorklog = order.worklogs?.[order.worklogs.length - 1]

                  return (
                    <Link key={order.id} href={`/orders/${order.id}`} className="block">
                      <div className="rounded-xl bg-white/70 border border-white/80 px-3 py-2.5 hover:border-white/95 transition shadow-[0_4px_10px_rgba(15,32,77,0.08)]">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-[0.14em]">
                              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                              <span>更新 {formatDateOnly(order.createdAt)}</span>
                            </div>
                            <h4 className="text-sm font-semibold text-slate-900 truncate">{order.productName}</h4>
                            <p className="text-[11px] text-slate-500 truncate">客戶：{order.customerName}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-white ${status === 'completed' ? 'bg-emerald-600' : status === 'inProgress' ? 'bg-blue-600' : 'bg-slate-600'}`}>
                            <Calendar className="h-3 w-3" />
                            {statusLabel}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-slate-600">
                          <span className="rounded-lg bg-white/80 border border-white/60 px-2 py-1">
                            <span className="text-slate-400 mr-1">訂單</span>
                            {formatNumber(order.productionQuantity)} 粒
                          </span>
                          <span className="rounded-lg bg-white/80 border border-white/60 px-2 py-1">
                            <span className="text-slate-400 mr-1">工時</span>
                            {order.worklogs && order.worklogs.length > 0 ? `${sumWorkUnits(order.worklogs as OrderWorklog[]).toFixed(1)}h` : '—'}
                          </span>
                          {order.customerService && (
                            <span className="rounded-lg bg-white/80 border border-white/60 px-2 py-1">
                              <span className="text-slate-400 mr-1">客服</span>
                              {order.customerService}
                            </span>
                          )}
                        </div>

                        {latestWorklog && (
                          <div className="rounded-lg bg-gradient-to-r from-indigo-500/10 via-indigo-400/10 to-purple-500/12 border border-indigo-100 px-2 py-1.5 text-[10px] text-indigo-600 mt-2 flex items-center justify-between">
                            <span>最新工時</span>
                            <span>{formatWorklogDate(latestWorklog.workDate)} {latestWorklog.startTime}-{latestWorklog.endTime}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-gray-500">
                目前沒有最近的生產紀錄。
              </div>
            )}
          </div>

          <div className={`rounded-2xl bg-white/65 border border-white/75 shadow-[0_4px_12px_rgba(15,32,77,0.1)] ${MINI_CARD_PADDING} space-y-3`}>
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-indigo-500" />最近工時紀錄
                </h3>
                <p className="text-[11px] text-slate-500">最新 5 筆工時</p>
              </div>
              <Link href="/worklogs" className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                查看全部<ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2.5">
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-5/6" />
              </div>
            ) : recentWorklogs.length > 0 ? (
              <div className="space-y-2">
                {recentWorklogs.map((worklog) => (
                  <div key={worklog.id} className="rounded-xl bg-white/70 border border-white/80 px-3 py-2.5 shadow-[0_4px_10px_rgba(15,32,77,0.08)]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase tracking-[0.14em]">
                          工時 {formatWorklogDate(worklog.workDate)}
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 truncate">{worklog.order?.productName || '未指派訂單'}</h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {worklog.order?.customerName ? `客戶：${worklog.order.customerName}` : '未指定客戶'}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-white bg-blue-600">
                        <Timer className="h-3 w-3" />
                        {(worklog.calculatedWorkUnits ?? 0).toFixed(1)} 工時
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-slate-600">
                      <span className="rounded-lg bg-white/80 border border-white/60 px-2 py-1">
                        <span className="text-slate-400 mr-1">負責人</span>
                        {'userName' in worklog && worklog.userName ? (worklog as any).userName : '未指定'}
                      </span>
                      {worklog.notes && (
                        <span className="rounded-lg bg-white/80 border border-white/60 px-2 py-1">
                          <span className="text-slate-400 mr-1">備註</span>
                          {worklog.notes}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-gray-500">
                目前沒有最近的工時紀錄。
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-2xl bg-white/65 border border-white/75 px-4 py-4 sm:px-5 sm:py-5 shadow-[0_5px_18px_rgba(15,32,77,0.08)]">
            <div className="flex items-center gap-3">
              <div className="icon-container icon-container-gradient-indigo">
                <Wand2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">AI 配方生成器</h3>
                <p className="text-xs text-slate-500">智慧分析原料比例與配方靈感</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mt-3">
              上傳需求後即時獲得建議配方並產出實際操作步驟，支援多語系與中文專業術語。
            </p>
          </div>

          <div className="rounded-2xl bg-white/65 border border-white/75 px-4 py-4 sm:px-5 sm:py-5 shadow-[0_5px_18px_rgba(15,32,77,0.08)]">
            <div className="flex items-center gap-3">
              <div className="icon-container icon-container-gradient-emerald">
                <FlaskConical className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">製粒分析工具</h3>
                <p className="text-xs text-slate-500">三十秒內評估製粒風險</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mt-3">
              自動判斷配方顆粒性、濕度與應用注意事項，提供客製化製程建議與 SOP 提示。
            </p>
          </div>

          <div className="rounded-2xl bg-white/65 border border-white/75 px-4 py-4 sm:px-5 sm:py-5 shadow-[0_5px_18px_rgba(15,32,77,0.08)]">
            <div className="flex items-center gap-3">
              <div className="icon-container icon-container-gradient-cyan">
                <ClipboardCheck className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">工作單生成</h3>
                <p className="text-xs text-slate-500">一鍵整理生產工作單與檢核表</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mt-3">
              整合工時、訂單與品質指標，自動輸出標準化工作單，支援列印與 CSV 匯出。
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white/70 border border-white/75 px-4 py-5 sm:px-6 sm:py-6 shadow-[0_6px_20px_rgba(15,32,77,0.08)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="icon-container icon-container-gradient-emerald">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">參考資料下載</h3>
                <p className="text-xs text-slate-500">生產培訓與風險管理文件</p>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <a
              href="/pdf/膠囊生產培訓手冊（香港版-修訂版）.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-xl bg-white/70 border border-white/80 px-4 py-3 hover:border-emerald-200 hover:bg-emerald-50/30 transition group"
            >
              <div className="mt-0.5">
                <Download className="h-4 w-4 text-emerald-600 group-hover:text-emerald-700" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700">膠囊生產培訓手冊（香港版-修訂版）</h4>
                <p className="text-xs text-slate-500 mt-1">完整生產流程與操作規範</p>
              </div>
            </a>
            <a
              href="/pdf/保健品行業常見生產風險原料清單.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-xl bg-white/70 border border-white/80 px-4 py-3 hover:border-emerald-200 hover:bg-emerald-50/30 transition group"
            >
              <div className="mt-0.5">
                <Download className="h-4 w-4 text-emerald-600 group-hover:text-emerald-700" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700">保健品行業常見生產風險原料清單</h4>
                <p className="text-xs text-slate-500 mt-1">風險原料辨識與管控指南</p>
              </div>
            </a>
          </div>
        </div>

        <div className="rounded-2xl bg-white/70 border border-white/75 px-4 py-5 sm:px-6 sm:py-6 shadow-[0_6px_20px_rgba(15,32,77,0.08)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="icon-container icon-container-gradient-sunrise">
                <CalendarDays className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">2025年10月9日 · 版本更新</h3>
                <p className="text-xs text-slate-500">最新版本：v2.2.3</p>
              </div>
            </div>
            <Link href="/history" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
              查看完整歷史
            </Link>
          </div>
          <ul className="mt-4 space-y-2 text-xs sm:text-sm text-slate-600">
            <li>· 首頁新增參考資料下載區塊，提供生產培訓手冊與風險原料清單。</li>
            <li>· 優化首頁訂單排序邏輯，優先顯示進行中訂單以改善工作流程。</li>
            <li>· 移除未完成的 RSS 新聞功能，確保系統穩定性與部署效率。</li>
          </ul>
        </div>
      </div>

      <LiquidGlassFooter />
    </div>
  )
}
