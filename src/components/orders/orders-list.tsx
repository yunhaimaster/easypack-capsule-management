'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ProductionOrder } from '@/types'
import { Button } from '@/components/ui/button'
import { LinkedFilter } from '@/components/ui/linked-filter'
import { Search, Filter, Download, Eye, Trash2, Edit, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { formatDateOnly } from '@/lib/utils'
import { useToast } from '@/components/ui/toast-provider'
import { LiquidGlassConfirmModal, useLiquidGlassModal } from '@/components/ui/liquid-glass-modal'
import { fetchWithTimeout } from '@/lib/api-client'

interface OrdersListProps {
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

const DEFAULT_STATUS_ORDER = {
  inProgress: 0,
  notStarted: 1,
  completed: 2
} as const

type StatusKey = keyof typeof DEFAULT_STATUS_ORDER

const determineStatus = (order: ProductionOrder): StatusKey => {
  const hasWorklog = Array.isArray(order.worklogs) && order.worklogs.length > 0
  const completed = Boolean(order.completionDate)
  if (hasWorklog && !completed) return 'inProgress'
  if (!completed) return 'notStarted'
  return 'completed'
}

const reorderOrdersByStatus = (orders: ProductionOrder[]) => {
  return [...orders].sort((a, b) => {
    const statusA = determineStatus(a)
    const statusB = determineStatus(b)
    if (statusA !== statusB) {
      return DEFAULT_STATUS_ORDER[statusA] - DEFAULT_STATUS_ORDER[statusB]
    }

    const dateA = a.completionDate ? new Date(a.completionDate).getTime() : new Date(a.createdAt).getTime()
    const dateB = b.completionDate ? new Date(b.completionDate).getTime() : new Date(b.createdAt).getTime()
    return dateB - dateA
  })
}

export function OrdersList({ initialOrders = [], initialPagination }: OrdersListProps) {
  const { showToast } = useToast()
  const deleteModal = useLiquidGlassModal()
  const abortControllerRef = useRef<AbortController | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [orders, setOrders] = useState<ProductionOrder[]>(initialOrders)
  const [pagination, setPagination] = useState(initialPagination)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [statusMessage, setStatusMessage] = useState('')
  
  // Dropdown options
  const [customerOptions, setCustomerOptions] = useState<{value: string, label: string}[]>([])
  const [productOptions, setProductOptions] = useState<{value: string, label: string}[]>([])
  const [ingredientOptions, setIngredientOptions] = useState<{value: string, label: string}[]>([])
  const [capsuleTypeOptions, setCapsuleTypeOptions] = useState<{value: string, label: string}[]>([])

  const cancelOngoingRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }

  const fetchOrders = useCallback(async (filtersToUse = filters) => {
    setLoading(true)
    setStatusMessage('訂單資料載入中…')
    try {
      cancelOngoingRequest()
      const controller = new AbortController()
      abortControllerRef.current = controller

      const params = new URLSearchParams()
      Object.entries(filtersToUse).forEach(([key, value]) => {
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
      const incomingOrders = data.orders || []
      const shouldApplyDefaultOrdering =
        filtersToUse.sortBy === DEFAULT_FILTERS.sortBy &&
        filtersToUse.sortOrder === DEFAULT_FILTERS.sortOrder &&
        !filtersToUse.customerName &&
        !filtersToUse.productName &&
        !filtersToUse.ingredientName &&
        !filtersToUse.capsuleType

      const normalizedOrders = shouldApplyDefaultOrdering
        ? reorderOrdersByStatus(incomingOrders)
        : incomingOrders

      setOrders(normalizedOrders)
      setPagination(data.pagination)
      setStatusMessage(`已載入 ${normalizedOrders.length} 筆訂單資料`)
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') {
        return
      }
      console.error('載入訂單錯誤:', error)
      setStatusMessage('載入訂單時發生錯誤')
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [filters])

  const fetchDropdownOptions = useCallback(async () => {
    try {
      const response = await fetchWithTimeout('/api/orders/options')
      if (!response.ok) {
        throw new Error('載入下拉選項失敗')
      }
      const payload = await response.json()
      if (!payload?.success) {
        throw new Error(payload?.error?.message || '載入下拉選項失敗')
      }
      const data = payload.data
      setCustomerOptions((data.customers || []).map((item: string) => ({ value: item, label: item })))
      setProductOptions((data.products || []).map((item: string) => ({ value: item, label: item })))
      setIngredientOptions((data.ingredients || []).map((item: string) => ({ value: item, label: item })))
      setCapsuleTypeOptions((data.capsuleTypes || []).map((item: string) => ({ value: item, label: item })))
    } catch (error) {
      console.error('載入下拉選項錯誤:', error)
    }
  }, [])

  useEffect(() => {
    fetchOrders(filters)
    return () => cancelOngoingRequest()
  }, [fetchOrders, filters])

  useEffect(() => {
    fetchDropdownOptions()
  }, [fetchDropdownOptions])

  const handleSearch = (searchFilters: {
    customerName: string
    productName: string
    ingredientName: string
    capsuleType: string
  }) => {
    const updatedFilters = { 
      ...filters, 
      ...searchFilters,
      page: 1 // Reset to first page when searching
    }
    setFilters(updatedFilters)
    fetchOrders(updatedFilters)
  }

  const handleLimitChange = (limit: number) => {
    const updatedFilters = {
      ...filters,
      limit,
      page: 1
    }
    setFilters(updatedFilters)
    fetchOrders(updatedFilters)
  }

  const handlePageChange = (page: number) => {
    const updatedFilters = { 
      ...filters, 
      page
    }
    setFilters(updatedFilters)
    fetchOrders(updatedFilters)
  }

  const handleSort = (column: string) => {
    let newSortOrder = 'asc'
    
    // 如果點擊的是當前排序列，切換排序順序
    if (filters.sortBy === column && filters.sortOrder === 'asc') {
      newSortOrder = 'desc'
    } else if (filters.sortBy === column && filters.sortOrder === 'desc') {
      newSortOrder = 'asc'
    }
    
    const updatedFilters = {
      ...filters,
      sortBy: column,
      sortOrder: newSortOrder,
      page: 1 // Reset to first page when sorting
    }
    
    setFilters(updatedFilters)
    fetchOrders(updatedFilters)
  }

  const getSortIcon = (column: string) => {
    if (filters.sortBy !== column) {
      return <ArrowUpDown className="h-3 w-3 text-neutral-400" aria-hidden="true" />
    }
    
    return filters.sortOrder === 'asc' 
      ? <ArrowUp className="h-3 w-3 text-neutral-600" aria-hidden="true" />
      : <ArrowDown className="h-3 w-3 text-neutral-600" aria-hidden="true" />
  }

  const requestDelete = (orderId: string) => {
    setPendingDeleteId(orderId)
    deleteModal.openModal()
  }

  const handleDelete = async () => {
    if (!pendingDeleteId) return

    const controller = new AbortController()

    try {
      const response = await fetchWithTimeout(`/api/orders/${pendingDeleteId}`, {
        method: 'DELETE',
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error('刪除訂單失敗')
      }

      const payload = await response.json()
      if (!payload?.success) {
        throw new Error(payload?.error?.message || '刪除訂單失敗')
      }

      showToast({
        title: '訂單已刪除',
        description: '選定的訂單已成功移除。'
      })
      setPendingDeleteId(null)
      deleteModal.closeModal()
      fetchOrders(filters)
    } catch (error) {
      console.error('刪除訂單錯誤:', error)
      showToast({
        title: '刪除失敗',
        description: '刪除訂單時出現問題，請稍後再試。',
        variant: 'destructive'
      })
      deleteModal.closeModal()
    }
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetchWithTimeout('/api/orders/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          includeIngredients: true,
        }),
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `production-orders-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      showToast({
        title: '匯出完成',
        description: `訂單資料已匯出為 ${format.toUpperCase()}。`
      })
    } catch (error) {
      console.error('Error exporting:', error)
      showToast({
        title: '匯出失敗',
        description: '匯出時發生錯誤，請稍後再試。',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="space-y-6" aria-live="polite" aria-busy={loading}>

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

        <div className="liquid-glass-card liquid-glass-card-brand liquid-glass-card-refraction" role="region" aria-labelledby="orders-list-heading">
          <div className="liquid-glass-content">
            <div className="mb-6">
              <h2 id="orders-list-heading" className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <span style={{ color: '#2a588c' }}>訂單管理</span>
              </h2>
              <p className="text-neutral-600 mt-2">管理所有膠囊生產訂單</p>
            </div>
          </div>
          <div className="overflow-x-auto" aria-live="polite">
            <span className="sr-only" role="status">{statusMessage}</span>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th
                    scope="col"
                    className="text-left py-3 px-4 font-medium text-neutral-900 text-sm"
                    aria-sort={filters.sortBy === 'customerName' ? (filters.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      onClick={() => handleSort('customerName')}
                      className="flex items-center gap-1 hover:text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
                    >
                      客戶名稱
                      {getSortIcon('customerName')}
                      <span className="sr-only">
                        {filters.sortBy === 'customerName' ? (filters.sortOrder === 'asc' ? '升冪排序' : '降冪排序') : '未排序'}
                      </span>
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="text-left py-3 px-4 font-medium text-neutral-900 text-sm"
                    aria-sort={filters.sortBy === 'productName' ? (filters.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      onClick={() => handleSort('productName')}
                      className="flex items-center gap-1 hover:text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
                    >
                      產品名稱
                      {getSortIcon('productName')}
                      <span className="sr-only">
                        {filters.sortBy === 'productName' ? (filters.sortOrder === 'asc' ? '升冪排序' : '降冪排序') : '未排序'}
                      </span>
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="text-left py-3 px-4 font-medium text-neutral-900 text-sm"
                    aria-sort={filters.sortBy === 'capsuleColor' ? (filters.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      onClick={() => handleSort('capsuleColor')}
                      className="flex items-center gap-1 hover:text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
                    >
                      膠囊規格
                      {getSortIcon('capsuleColor')}
                      <span className="sr-only">
                        {filters.sortBy === 'capsuleColor' ? (filters.sortOrder === 'asc' ? '升冪排序' : '降冪排序') : '未排序'}
                      </span>
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="text-left py-3 px-4 font-medium text-neutral-900 text-sm"
                    aria-sort={filters.sortBy === 'ingredients' ? (filters.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      onClick={() => handleSort('ingredients')}
                      className="flex items-center gap-1 hover:text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
                    >
                      原料成分
                      {getSortIcon('ingredients')}
                      <span className="sr-only">
                        {filters.sortBy === 'ingredients' ? (filters.sortOrder === 'asc' ? '升冪排序' : '降冪排序') : '未排序'}
                      </span>
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="text-left py-3 px-4 font-medium text-neutral-900 text-sm"
                    aria-sort={filters.sortBy === 'productionQuantity' ? (filters.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      onClick={() => handleSort('productionQuantity')}
                      className="flex items-center gap-1 hover:text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
                    >
                      生產數量
                      {getSortIcon('productionQuantity')}
                      <span className="sr-only">
                        {filters.sortBy === 'productionQuantity' ? (filters.sortOrder === 'asc' ? '升冪排序' : '降冪排序') : '未排序'}
                      </span>
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="text-left py-3 px-4 font-medium text-neutral-900 text-sm"
                    aria-sort={filters.sortBy === 'completionDate' ? (filters.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      onClick={() => handleSort('completionDate')}
                      className="flex items-center gap-1 hover:text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
                    >
                      完工日期
                      {getSortIcon('completionDate')}
                      <span className="sr-only">
                        {filters.sortBy === 'completionDate' ? (filters.sortOrder === 'asc' ? '升冪排序' : '降冪排序') : '未排序'}
                      </span>
                    </button>
                  </th>
                  <th scope="col" className="text-left py-3 px-4 font-medium text-neutral-900 text-sm">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-neutral-500">
                      載入中...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-neutral-500">
                      沒有找到訂單
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr 
                      key={order.id} 
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => window.location.href = `/orders/${order.id}`}
                    >
                      <td className="py-3 px-4 text-neutral-900 text-sm">
                        {order.customerName}
                      </td>
                      <td className="py-3 px-4 text-neutral-900 text-sm">
                        {order.productName}
                      </td>
                      <td className="py-3 px-4 text-neutral-900 text-sm">
                        <div className="flex items-center gap-2">
                          {order.capsuleColor && (
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300" 
                              style={{ backgroundColor: order.capsuleColor === '紅色' ? '#ef4444' : 
                                         order.capsuleColor === '藍色' ? '#3b82f6' :
                                         order.capsuleColor === '綠色' ? '#10b981' :
                                         order.capsuleColor === '黃色' ? '#f59e0b' :
                                         order.capsuleColor === '白色' ? '#ffffff' :
                                         order.capsuleColor === '透明' ? 'transparent' : '#6b7280'
                              }}
                            />
                          )}
                          <span className="text-sm">
                            {order.capsuleColor || '未設定'}{order.capsuleSize ? order.capsuleSize : ''}{order.capsuleType || ''}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-neutral-900 text-sm">
                        <div className="text-sm max-w-xs">
                          {order.ingredients && order.ingredients.length > 0 ? (
                            <div className="space-y-1">
                              {order.ingredients
                                .sort((a, b) => (b.unitContentMg || 0) - (a.unitContentMg || 0))
                                .slice(0, 2)
                                .map((ingredient, index) => (
                                <div key={index}>
                                  <span className="text-sm">{ingredient.materialName}</span>
                                </div>
                              ))}
                              {order.ingredients.length > 2 && (
                                <div className="text-neutral-500 text-sm">
                                  +{order.ingredients.length - 2} 更多...
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-neutral-500 text-sm">無原料資料</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-neutral-900 text-sm">
                        {order.productionQuantity?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-neutral-900 text-sm">
                        {order.completionDate ? formatDateOnly(order.completionDate) : '未完工'}
                      </td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = `/orders/${order.id}/edit`}
                            className="h-6 w-6 p-0 text-xs"
                            aria-label="編輯訂單"
                            title="編輯訂單"
                          >
                            <Edit className="h-3 w-3" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => requestDelete(order.id)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 text-xs"
                            aria-label="刪除訂單"
                            title="刪除訂單"
                          >
                            <Trash2 className="h-3 w-3" aria-hidden="true" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {pagination && (
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                上一頁
              </Button>
              <span className="flex items-center px-4 py-2 text-sm text-neutral-600 ">
                第 {pagination.page} 頁，共 {pagination.totalPages} 頁
              </span>
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                下一頁
              </Button>
            </div>
          </div>
        )}

        <LiquidGlassConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => {
            deleteModal.closeModal()
            setPendingDeleteId(null)
          }}
          onConfirm={handleDelete}
          title="刪除訂單"
          message="刪除後將無法恢復，確定要繼續嗎？"
          confirmText="刪除"
          cancelText="取消"
          variant="danger"
        />

    </div>
  )
}
