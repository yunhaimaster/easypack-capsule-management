'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { ProductionOrder } from '@/types'
import { Button } from '@/components/ui/button'
import { LinkedFilter } from '@/components/ui/linked-filter'
import { LiquidGlassConfirmModal, useLiquidGlassModal } from '@/components/ui/liquid-glass-modal'
import { OrderAIAssistant } from '@/components/ai/order-ai-assistant'
import { TableWrapper } from '@/components/ui/table-wrapper'
import { Search, Filter, Download, Eye, Trash2, Edit, ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, AlertTriangle, ClipboardCheck, Bot, Timer, Square, Calendar, Package2, RefreshCw, Loader2 } from 'lucide-react'
import { formatDateOnly, downloadFile } from '@/lib/utils'
import { useToast } from '@/components/ui/toast-provider'
import { fetchWithTimeout } from '@/lib/api-client'

interface ResponsiveOrdersListProps {
  initialOrders?: ProductionOrder[]
  initialPagination?: any
}

const DEFAULT_FILTERS = {
  customerName: '',
  productName: '',
  ingredientName: '',
  capsuleType: '',
  page: 1,
  limit: 25,
  sortBy: 'completionDate',
  sortOrder: 'desc'
}

const STATUS_ORDER = {
  inProgress: 0,
  notStarted: 1,
  completed: 2
} as const

type StatusKey = keyof typeof STATUS_ORDER

const resolveOrderStatus = (order: ProductionOrder): StatusKey => {
  const hasWork = Array.isArray(order.worklogs) && order.worklogs.length > 0
  const completed = Boolean(order.completionDate)
  if (hasWork && !completed) return 'inProgress'
  if (!completed) return 'notStarted'
  return 'completed'
}

const sortOrdersByStatus = (orders: ProductionOrder[]) =>
  [...orders].sort((a, b) => {
    const statusA = resolveOrderStatus(a)
    const statusB = resolveOrderStatus(b)
    if (statusA !== statusB) {
      return STATUS_ORDER[statusA] - STATUS_ORDER[statusB]
    }

    const dateA = a.completionDate ? new Date(a.completionDate).getTime() : new Date(a.createdAt).getTime()
    const dateB = b.completionDate ? new Date(b.completionDate).getTime() : new Date(b.createdAt).getTime()
    return dateB - dateA
  })

export function ResponsiveOrdersList({ initialOrders = [], initialPagination }: ResponsiveOrdersListProps) {
  const { showToast } = useToast()
  const abortControllerRef = useRef<AbortController | null>(null)
  const [orders, setOrders] = useState<ProductionOrder[]>(initialOrders)
  const [statusMessage, setStatusMessage] = useState('')
  
  // 檢查訂單是否有製程問題或品管備註
  const hasProcessOrQualityIssues = (order: ProductionOrder) => {
    return (order.processIssues && order.processIssues.trim() !== '') || 
           (order.qualityNotes && order.qualityNotes.trim() !== '')
  }
  const [pagination, setPagination] = useState(initialPagination)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
  const [selectedOrderForAI, setSelectedOrderForAI] = useState<ProductionOrder | null>(null)
  
  // Modal hooks
  const deleteConfirmModal = useLiquidGlassModal()
  
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  
  // Dropdown options
  const [customerOptions, setCustomerOptions] = useState<Array<{value: string, label: string}>>([])
  const [productOptions, setProductOptions] = useState<Array<{value: string, label: string}>>([])
  const [ingredientOptions, setIngredientOptions] = useState<Array<{value: string, label: string}>>([])
  const [capsuleTypeOptions, setCapsuleTypeOptions] = useState<Array<{value: string, label: string}>>([])

  const cancelActiveRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }

  const fetchOrders = useCallback(async (newFilters = filters) => {
    try {
      cancelActiveRequest()
      const controller = new AbortController()
      abortControllerRef.current = controller

      setLoading(true)
      setStatusMessage('訂單資料載入中…')
      setError(null)

      const params = new URLSearchParams()
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.append(key, value.toString())
        }
      })

      const response = await fetchWithTimeout(`/api/orders?${params}`, { signal: controller.signal })

      if (!response.ok) {
        throw new Error('載入訂單失敗')
      }

      const payload = await response.json()
      if (!payload?.success) {
        throw new Error(payload?.error?.message || '載入訂單失敗')
      }

      const data = payload.data
      const incomingOrders = Array.isArray(data.orders) ? data.orders : []
      const shouldUseDefault =
        newFilters.sortBy === DEFAULT_FILTERS.sortBy &&
        newFilters.sortOrder === DEFAULT_FILTERS.sortOrder &&
        !newFilters.customerName &&
        !newFilters.productName &&
        !newFilters.ingredientName &&
        !newFilters.capsuleType

      setOrders(shouldUseDefault ? sortOrdersByStatus(incomingOrders) : incomingOrders)
      setPagination(data.pagination)
      setStatusMessage(`已載入 ${incomingOrders.length} 筆訂單`)
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') {
        return
      }
      console.error('Error fetching orders:', error)
      setStatusMessage('載入訂單時發生錯誤')
      showToast({
        title: '載入失敗',
        description: '取得訂單資料時發生錯誤，請稍後再試。',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [filters, showToast])

  // Fetch dropdown options
  const fetchOptions = useCallback(async () => {
    try {
      const response = await fetchWithTimeout('/api/orders/options')
      if (!response.ok) {
        throw new Error('載入選項失敗')
      }
      const payload = await response.json()
      if (!payload?.success) {
        throw new Error(payload?.error?.message || '載入選項失敗')
      }
      const data = payload.data || {}
      setCustomerOptions(Array.isArray(data.customers) ? data.customers.map((item: string) => ({ value: item, label: item })) : [])
      setProductOptions(Array.isArray(data.products) ? data.products.map((item: string) => ({ value: item, label: item })) : [])
      setIngredientOptions(Array.isArray(data.ingredients) ? data.ingredients.map((item: string) => ({ value: item, label: item })) : [])
      setCapsuleTypeOptions(Array.isArray(data.capsuleTypes) ? data.capsuleTypes.map((item: string) => ({ value: item, label: item })) : [])
    } catch (error) {
      console.error('Error fetching options:', error)
    }
  }, [])

  useEffect(() => {
    fetchOrders(filters)
    fetchOptions()
    return () => cancelActiveRequest()
  }, [fetchOrders, fetchOptions, filters])

  const handleSearch = useCallback((newFilters: any) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 }
    setFilters(updatedFilters)
    fetchOrders(updatedFilters)
  }, [fetchOrders, filters])

  const handleLimitChange = useCallback((limit: number) => {
    const updatedFilters = { ...filters, limit, page: 1 }
    setFilters(updatedFilters)
    fetchOrders(updatedFilters)
  }, [fetchOrders, filters])

  const handleSort = useCallback((field: string) => {
    const newOrder = filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc'
    const newFilters = { ...filters, sortBy: field, sortOrder: newOrder }
    setFilters(newFilters)
    fetchOrders(newFilters)
  }, [fetchOrders, filters])

  const getSortIcon = (field: string) => {
    if (filters.sortBy !== field) return <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
    return filters.sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" aria-hidden="true" /> : <ArrowDown className="h-3 w-3" aria-hidden="true" />
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetchWithTimeout('/api/orders/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format,
          filters
        })
      })

      if (!response.ok) {
        throw new Error('匯出失敗，請稍後再試')
      }

      const blob = await response.blob()
      const filename = `production-orders-${new Date().toISOString().split('T')[0]}.${format}`
      const mimeType = format === 'csv' ? 'text/csv;charset=utf-8' : 'application/pdf'
      downloadFile(blob, filename, mimeType)
      showToast({
        title: '匯出完成',
        description: `訂單已匯出為 ${format.toUpperCase()} 檔案。`
      })
    } catch (error) {
      console.error('匯出錯誤:', error)
      showToast({
        title: '匯出失敗',
        description: '匯出資料時發生錯誤，請稍後再試。',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteClick = (orderId: string) => {
    setOrderToDelete(orderId)
    deleteConfirmModal.openModal()
  }

  const handleOrderAIClick = (order: ProductionOrder) => {
    setSelectedOrderForAI(order)
  }

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return

    const controller = new AbortController()

    try {
      const response = await fetchWithTimeout(`/api/orders/${orderToDelete}`, {
        method: 'DELETE',
        signal: controller.signal,
      })
      
      if (!response.ok) throw new Error('刪除訂單失敗')

      const payload = await response.json()
      if (!payload?.success) {
        throw new Error(payload?.error?.message || '刪除訂單失敗')
      }

      fetchOrders(filters)
      setOrderToDelete(null)
      showToast({
        title: '訂單已刪除',
        description: '選定的訂單已成功刪除。'
      })
    } catch (error) {
      console.error('刪除訂單錯誤:', error)
      showToast({
        title: '刪除失敗',
        description: '刪除訂單時發生錯誤，請稍後再試。',
        variant: 'destructive'
      })
    } finally {
      abortControllerRef.current = null
    }
  }

  const getCapsuleColorCode = (color: string) => {
    switch (color) {
      case '紅色': return '#ef4444'
      case '藍色': return '#3b82f6'
      case '綠色': return '#10b981'
      case '黃色': return '#f59e0b'
      case '白色': return '#ffffff'
      case '透明': return 'transparent'
      default: return '#6b7280'
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* 篩選器 */}
      <LinkedFilter
        customerOptions={customerOptions}
        productOptions={productOptions}
        ingredientOptions={ingredientOptions}
        capsuleOptions={capsuleTypeOptions}
        onSearch={handleSearch}
        onExport={() => handleExport('csv')}
        loading={loading}
        limit={filters.limit}
        onLimitChange={handleLimitChange}
      />

      {/* 桌面版表格 */}
      <div className="hidden lg:block">
        <TableWrapper>
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-white/80 dark:bg-elevation-0/80">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-neutral-900 dark:text-white/95 text-sm">客戶 / 產品</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-900 dark:text-white/95 text-sm">狀態</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-900 dark:text-white/95 text-sm">訂單資訊</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-900 dark:text-white/95 text-sm">配方摘要</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-900 dark:text-white/95 text-sm">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-neutral-500 dark:text-white/65">
                    載入中...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-neutral-500 dark:text-white/65">
                    沒有找到訂單
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const status = resolveOrderStatus(order)
                  const statusLabel = STATUS_ORDER[status] === 0 ? '進行中' : STATUS_ORDER[status] === 1 ? '未開始' : '已完成'
                  const statusBadgeClass =
                    STATUS_ORDER[status] === 0
                      ? 'bg-primary-600 text-white'
                      : STATUS_ORDER[status] === 1
                        ? 'bg-neutral-600 text-white'
                        : 'bg-success-600 text-white'

                  const latestWorklog = order.worklogs && order.worklogs.length > 0
                    ? order.worklogs[order.worklogs.length - 1]
                    : null

                  return (
                    <tr
                      key={order.id}
                      className="border-b border-neutral-100 dark:border-white/10 hover:bg-white/80 dark:hover:bg-elevation-1 transition-colors"
                      onClick={() => window.location.href = `/orders/${order.id}`}
                    >
                      <td className="py-4 px-4 text-neutral-900 text-sm align-top">
                        <div className="flex flex-col gap-1">
                          <div className="font-semibold text-neutral-900 dark:text-white/95 text-base">{order.productName}</div>
                          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-white/75">
                            <span>{order.customerName}</span>
                            {order.customerService && (
                              <span className="text-xs bg-neutral-100 dark:bg-elevation-2 text-neutral-500 dark:text-white/65 px-2 py-0.5 rounded-full">客服：{order.customerService}</span>
                            )}
                          </div>
                          {hasProcessOrQualityIssues(order) && (
                            <div className="flex items-center gap-1 text-xs text-neutral-400 dark:text-white/55">
                              {order.processIssues && order.processIssues.trim() !== '' && (
                                <div title={`製程問題: ${order.processIssues}`}>
                                  <AlertTriangle className="h-3.5 w-3.5 text-danger-500" aria-hidden="true" />
                                </div>
                              )}
                              {order.qualityNotes && order.qualityNotes.trim() !== '' && (
                                <div title={`品管備註: ${order.qualityNotes}`}>
                                  <ClipboardCheck className="h-3.5 w-3.5 text-primary-500" aria-hidden="true" />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm align-top">
                        <div className="flex flex-col gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass}`}>
                            {STATUS_ORDER[status] === 0 ? <Timer className="h-3.5 w-3.5" aria-hidden="true" /> : STATUS_ORDER[status] === 2 ? <Calendar className="h-3.5 w-3.5" aria-hidden="true" /> : <Square className="h-3.5 w-3.5" aria-hidden="true" />}
                            {statusLabel}
                          </span>
                          <div className="text-xs text-neutral-500 dark:text-white/65 leading-relaxed">
                            {STATUS_ORDER[status] === 2 && order.completionDate ? (
                              <div>完成日期：{typeof order.completionDate === 'string' ? order.completionDate : formatDateOnly(order.completionDate)}</div>
                            ) : null}
                            {STATUS_ORDER[status] === 0 && order.totalWorkUnits ? (
                              <div>累積工時：{order.totalWorkUnits.toFixed(1)} 工時</div>
                            ) : null}
                            {STATUS_ORDER[status] === 0 && latestWorklog ? (
                              <div>最新工時：{formatDateOnly(latestWorklog.workDate)} {latestWorklog.startTime}-{latestWorklog.endTime}</div>
                            ) : null}
                            {STATUS_ORDER[status] === 1 ? (
                              <div>尚未安排工時</div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-neutral-700 dark:text-white/85 align-top">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Package2 className="h-3.5 w-3.5 text-neutral-400 dark:text-white/55" aria-hidden="true" />
                            <span className="font-medium text-neutral-900">訂單數量：{order.productionQuantity?.toLocaleString()} 粒</span>
                          </div>
                          {order.actualProductionQuantity != null && (
                            <div className="text-xs text-neutral-500 dark:text-white/65">實際生產：{order.actualProductionQuantity.toLocaleString()} 粒</div>
                          )}
                          {order.materialYieldQuantity != null && (
                            <div className="text-xs text-neutral-500 dark:text-white/65">材料可做：{order.materialYieldQuantity.toLocaleString()} 粒</div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-neutral-900 text-sm align-top">
                        <div className="text-sm max-w-xs text-neutral-600 dark:text-white/75 leading-relaxed">
                          {order.ingredients && order.ingredients.length > 0 ? (
                            <>
                              <div className="font-medium text-neutral-700 dark:text-white/85 mb-1">主要原料：</div>
                              <div className="flex flex-wrap gap-1 text-xs">
                                {order.ingredients
                                  .sort((a, b) => (b.unitContentMg || 0) - (a.unitContentMg || 0))
                                  .slice(0, 3)
                                  .map((ingredient, index) => (
                                    <span key={index} className="bg-surface-primary/80 dark:bg-elevation-2 border border-neutral-200 dark:border-white/20 px-2 py-0.5 rounded-full">
                                      {ingredient.materialName}
                                    </span>
                                  ))}
                                {order.ingredients.length > 3 && (
                                  <span className="text-neutral-400 dark:text-white/55">+{order.ingredients.length - 3}</span>
                                )}
                              </div>
                            </>
                          ) : (
                            <span className="text-neutral-400 dark:text-white/55">無原料資料</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = `/orders/${order.id}`
                            }}
                            className="text-neutral-500 hover:text-neutral-700 dark:text-white/85 transition-colors"
                            title="查看訂單"
                            aria-label="查看訂單"
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = `/orders/${order.id}/edit`
                            }}
                            className="text-primary-600 hover:text-primary-800 transition-colors"
                            title="編輯訂單"
                            aria-label="編輯訂單"
                          >
                            <Edit className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOrderAIClick(order)
                            }}
                            className="text-purple-600 hover:text-purple-800 transition-colors"
                            title="Order AI 分析"
                            aria-label="打開 AI 分析"
                          >
                            <Bot className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteClick(order.id)
                            }}
                            className="text-danger-600 hover:text-danger-800 transition-colors"
                            title="刪除訂單"
                            aria-label="刪除訂單"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </TableWrapper>
      </div>
      
      {/* Mobile cards */}
      <div className="lg:hidden space-y-4">
        {loading ? (
          <div className="text-center py-8 text-neutral-500 dark:text-white/65">
            載入中...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 dark:text-white/65">
            沒有找到訂單
          </div>
        ) : (
          orders.map((order) => {
            const status = resolveOrderStatus(order)
            const statusLabel = STATUS_ORDER[status] === 0 ? '進行中' : STATUS_ORDER[status] === 1 ? '未開始' : '已完成'
            const latestWorklog = order.worklogs && order.worklogs.length > 0
              ? order.worklogs[order.worklogs.length - 1]
              : null

            return (
              <div
                key={order.id}
                className="liquid-glass-card liquid-glass-card-brand liquid-glass-card-refraction cursor-pointer"
                onClick={() => window.location.href = `/orders/${order.id}`}
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900 dark:text-white/95">{order.productName}</h3>
                      <p className="text-xs text-neutral-500 dark:text-white/65">{order.customerName}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium inline-flex items-center gap-1 ${STATUS_ORDER[status] === 2 ? 'bg-success-600 text-white' : STATUS_ORDER[status] === 0 ? 'bg-primary-600 text-white' : 'bg-neutral-600 text-white'}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="text-xs text-neutral-500 dark:text-white/65 space-y-1">
                    {STATUS_ORDER[status] === 2 && order.completionDate && (
                      <div>完成：{typeof order.completionDate === 'string' ? order.completionDate : formatDateOnly(order.completionDate)}</div>
                    )}
                    {STATUS_ORDER[status] === 0 && order.totalWorkUnits && (
                      <div>累積：{order.totalWorkUnits.toFixed(1)} 工時</div>
                    )}
                    {STATUS_ORDER[status] === 0 && latestWorklog && (
                      <div>最新工時：{formatDateOnly(latestWorklog.workDate)} {latestWorklog.startTime}-{latestWorklog.endTime}</div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-white/75">
                    <div>
                      <span className="block text-neutral-400 dark:text-white/55">訂單數量</span>
                      <span className="text-sm font-semibold text-neutral-900">{order.productionQuantity?.toLocaleString()} 粒</span>
                    </div>
                    {order.actualProductionQuantity != null && (
                      <div>
                        <span className="block text-neutral-400 dark:text-white/55">實際生產</span>
                        <span className="text-sm font-semibold text-neutral-900">{order.actualProductionQuantity.toLocaleString()} 粒</span>
                      </div>
                    )}
                  </div>

                  {order.ingredients && order.ingredients.length > 0 ? (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {order.ingredients.slice(0, 3).map((ingredient, index) => (
                        <span key={index} className="bg-surface-primary/80 dark:bg-elevation-2 border border-neutral-200 dark:border-white/20 px-2 py-0.5 rounded-full">
                          {ingredient.materialName}
                        </span>
                      ))}
                      {order.ingredients.length > 3 && (
                        <span className="text-neutral-400 dark:text-white/55">+{order.ingredients.length - 3}</span>
                      )}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.location.href = `/orders/${order.id}/edit`
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" aria-hidden="true" /> 編輯
                    </Button>
                    <Button
                      size="sm"
                      className="bg-primary-600 hover:bg-primary-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOrderAIClick(order)
                      }}
                    >
                      <Bot className="h-4 w-4 mr-1" aria-hidden="true" /> AI
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 分頁 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newFilters = { ...filters, page: filters.page - 1 }
              setFilters(newFilters)
              fetchOrders(newFilters)
            }}
            disabled={filters.page <= 1}
          >
            上一頁
          </Button>
          
          <span className="text-sm text-neutral-600 dark:text-white/75 px-4">
            第 {filters.page} 頁，共 {pagination.totalPages} 頁
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newFilters = { ...filters, page: filters.page + 1 }
              setFilters(newFilters)
              fetchOrders(newFilters)
            }}
            disabled={filters.page >= pagination.totalPages}
          >
            下一頁
          </Button>
        </div>
      )}

      {/* 刪除確認模態框 */}
      <LiquidGlassConfirmModal
        isOpen={deleteConfirmModal.isOpen}
        onClose={deleteConfirmModal.closeModal}
        onConfirm={handleDeleteConfirm}
        title="確認刪除訂單"
        message="您確定要刪除此訂單嗎？此操作無法撤銷，所有相關的配方和原料資料都將被永久刪除。"
        confirmText="刪除"
        cancelText="取消"
        variant="danger"
      />

      {/* Order AI Assistant */}
      {selectedOrderForAI && (
        <OrderAIAssistant
          order={selectedOrderForAI}
          isOpen={true}
          onClose={() => setSelectedOrderForAI(null)}
        />
      )}
      <span className="sr-only" role="status">{statusMessage}</span>
    </div>
  )
}
