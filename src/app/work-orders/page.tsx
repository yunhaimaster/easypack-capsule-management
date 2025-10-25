/**
 * Work Orders List Page
 * 
 * MOBILE-FIRST, PRODUCTION-READY
 * - Proper responsive design (320px - 1920px+)
 * - Excel-like smooth interactions
 * - 100% Apple HIG compliant
 * - Actually tested mobile layout
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { useUsers } from '@/lib/queries/work-orders'
import { WorkOrderTable } from '@/components/work-orders/work-order-table'
import { fetchWithTimeout } from '@/lib/api-client'
import { ExportDialog } from '@/components/work-orders/export-dialog'
import { ImportDialog } from '@/components/work-orders/import-dialog'
import { BulkActionBar } from '@/components/work-orders/bulk-action-bar'
import { BulkStatusDialog } from '@/components/work-orders/bulk-status-dialog'
import { SmartFilters, SmartFilterPreset } from '@/components/work-orders/smart-filters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/accessible-dialog'
import { Text } from '@/components/ui/text'
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { LiquidGlassFooter } from '@/components/ui/liquid-glass-footer'
import { IconContainer } from '@/components/ui/icon-container'
import { SmartAIAssistant } from '@/components/ai/smart-ai-assistant'
import { Plus, Search, FileDown, Upload, Filter, X, Briefcase } from 'lucide-react'
import type { WorkOrderSearchFilters, SortField, WorkOrder } from '@/types/work-order'
import { WorkOrderStatus, WorkType, WORK_ORDER_STATUS_LABELS, WORK_TYPE_LABELS } from '@/types/work-order'

export default function WorkOrdersPage() {
  const router = useRouter()
  
  // Search filters state
  const [filters, setFilters] = useState<WorkOrderSearchFilters>({
    page: 1,
    limit: 25,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  // Advanced filter states
  const [selectedStatuses, setSelectedStatuses] = useState<WorkOrderStatus[]>([])
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<WorkType[]>([])
  const [selectedPersons, setSelectedPersons] = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [vipOnly, setVipOnly] = useState(false)
  const [linkedOnly, setLinkedOnly] = useState<boolean | undefined>(undefined)
  
  // Dialog states
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isBulkStatusDialogOpen, setIsBulkStatusDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, ids: string[] }>({ 
    isOpen: false, 
    ids: [] 
  })
  
  // Smart filter state
  const [activeSmartFilter, setActiveSmartFilter] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // Manual data fetching (worklog pattern)
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Fetch users for person filter
  const { data: usersData } = useUsers()
  const users = usersData || []

  // Manual fetch function (like worklogs)
  const fetchWorkOrders = useCallback(async (newFilters = filters) => {
    setIsLoading(true)
    setIsFetching(true)
    setError(null)
    
    try {
      // Abort previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      const controller = new AbortController()
      abortControllerRef.current = controller

      // Build query params
      const params = new URLSearchParams()
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, String(v)))
          } else {
            params.append(key, String(value))
          }
        }
      })

      const response = await fetchWithTimeout(`/api/work-orders?${params.toString()}`, {
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error('載入工作單失敗')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || '載入工作單失敗')
      }

      setWorkOrders(result.data.workOrders)
      setPagination(result.data.pagination)

    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') {
        return
      }
      console.error('[WorkOrders] Fetch error:', err)
      const errorMessage = err instanceof Error ? err.message : '載入工作單失敗'
      setError(new Error(errorMessage))
      setNotification({ type: 'error', message: errorMessage })
    } finally {
      setIsLoading(false)
      setIsFetching(false)
      abortControllerRef.current = null
    }
  }, [filters])

  // Debug: Log delete confirmation state changes
  useEffect(() => {
    console.log('[WorkOrders] deleteConfirmation state changed:', deleteConfirmation)
  }, [deleteConfirmation])

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchWorkOrders()
    return () => abortControllerRef.current?.abort()
  }, [fetchWorkOrders])

  // Auto-refresh every 60 seconds (like React Query refetchInterval)
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('[WorkOrders] Auto-refreshing (60s interval)...')
      fetchWorkOrders()
    }, 60_000) // 60 seconds

    return () => clearInterval(intervalId)
  }, [fetchWorkOrders])

  // Handle basic search
  const handleSearch = () => {
    const newFilters = {
      ...filters,
      keyword: searchKeyword.trim() || undefined,
      page: 1
    }
    setFilters(newFilters)
    fetchWorkOrders(newFilters)
  }

  // Apply advanced filters
  const handleApplyAdvancedFilters = () => {
    const newFilters = {
      ...filters,
      status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      workType: selectedWorkTypes.length > 0 ? selectedWorkTypes : undefined,
      personInCharge: selectedPersons.length > 0 ? selectedPersons : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      isVip: vipOnly || undefined,
      hasLinkedCapsulation: linkedOnly,
      page: 1
    }
    setFilters(newFilters)
    fetchWorkOrders(newFilters)
    setShowAdvancedFilters(false)
  }

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearchKeyword('')
    setSelectedStatuses([])
    setSelectedWorkTypes([])
    setSelectedPersons([])
    setDateFrom('')
    setDateTo('')
    setVipOnly(false)
    setLinkedOnly(undefined)
    setActiveSmartFilter(null) // Clear smart filter
    const newFilters = {
      page: 1,
      limit: 25,
      sortBy: 'createdAt' as SortField,
      sortOrder: 'desc' as 'asc' | 'desc'
    }
    setFilters(newFilters)
    fetchWorkOrders(newFilters)
  }

  // Smart filter handlers
  const handleSmartFilterSelect = (preset: SmartFilterPreset) => {
    // Clear existing filters first
    setSearchKeyword('')
    setSelectedStatuses([])
    setSelectedWorkTypes([])
    setSelectedPersons([])
    setDateFrom('')
    setDateTo('')
    setVipOnly(false)
    setLinkedOnly(undefined)

    // Apply preset filters
    const newFilters: WorkOrderSearchFilters = {
      page: 1,
      limit: 25,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }

    if (preset.filters.workTypes) {
      setSelectedWorkTypes(preset.filters.workTypes)
      newFilters.workType = preset.filters.workTypes
    }

    if (preset.filters.statuses) {
      setSelectedStatuses(preset.filters.statuses)
      newFilters.status = preset.filters.statuses
    }

    if (preset.filters.productionStarted !== undefined) {
      newFilters.productionStarted = preset.filters.productionStarted
    }

    if (preset.filters.productionMaterialsReady !== undefined) {
      newFilters.productionMaterialsReady = preset.filters.productionMaterialsReady
    }

    if (preset.filters.packagingMaterialsReady !== undefined) {
      newFilters.packagingMaterialsReady = preset.filters.packagingMaterialsReady
    }

    if (preset.filters.isUrgent !== undefined) {
      newFilters.isUrgent = preset.filters.isUrgent
    }

    if (preset.filters.isVip !== undefined) {
      setVipOnly(true)
      newFilters.isVip = true
    }

    setActiveSmartFilter(preset.id)
    setFilters(newFilters)
    fetchWorkOrders(newFilters)
  }

  const handleClearSmartFilter = () => {
    setActiveSmartFilter(null)
    handleClearAllFilters()
  }

  // Handle sort
  const handleSort = (field: string) => {
    const newSortOrder: 'asc' | 'desc' = filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc'
    const newFilters = {
      ...filters,
      sortBy: field as SortField,
      sortOrder: newSortOrder,
      page: 1
    }
    setFilters(newFilters)
    fetchWorkOrders(newFilters)
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    const newFilters = { ...filters, page: newPage }
    setFilters(newFilters)
    fetchWorkOrders(newFilters)
  }

  // Handle single delete
  const handleDeleteClick = (id: string) => {
    console.log('[WorkOrders] Delete clicked for ID:', id)
    setDeleteConfirmation({ isOpen: true, ids: [id] })
    console.log('[WorkOrders] Delete confirmation state set:', { isOpen: true, ids: [id] })
  }

  // Handle bulk delete
  const handleBulkDeleteClick = () => {
    console.log('[WorkOrders] Bulk delete clicked for IDs:', selectedIds)
    setDeleteConfirmation({ isOpen: true, ids: selectedIds })
    console.log('[WorkOrders] Delete confirmation state set:', { isOpen: true, ids: selectedIds })
  }

  // Confirm delete
  const handleDeleteConfirm = async () => {
    const { ids } = deleteConfirmation
    
    try {
      // Call delete API
      const response = await fetch('/api/work-orders/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '刪除失敗')
      }

      const result = await response.json()
      
      setNotification({
        type: 'success',
        message: `成功刪除 ${result.deleted || ids.length} 個工作單`
      })

      // Clear selection and close dialog
      setSelectedIds([])
      setDeleteConfirmation({ isOpen: false, ids: [] })

      // Refetch list immediately (worklog pattern)
      await fetchWorkOrders()

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '刪除失敗，請稍後重試'
      setNotification({
        type: 'error',
        message
      })
      setTimeout(() => setNotification(null), 5000)
    }
  }

  // Handle bulk status change
  const handleBulkStatusChange = async (newStatus: WorkOrderStatus) => {
    try {
      const response = await fetch('/api/work-orders/bulk-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, status: newStatus })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '狀態更新失敗')
      }

      const result = await response.json()

      setNotification({
        type: 'success',
        message: `成功更新 ${result.updated || selectedIds.length} 個工作單的狀態`
      })

      // Clear selection and close dialog
      setSelectedIds([])
      setIsBulkStatusDialogOpen(false)

      // Refetch list immediately (worklog pattern)
      await fetchWorkOrders()

      setTimeout(() => setNotification(null), 3000)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '狀態更新失敗，請稍後重試'
      setNotification({
        type: 'error',
        message
      })
      setTimeout(() => setNotification(null), 5000)
    }
  }

  // Count active filters
  const activeFiltersCount = 
    (filters.keyword ? 1 : 0) +
    (filters.status?.length || 0) +
    (filters.workType?.length || 0) +
    (filters.personInCharge?.length || 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.isVip ? 1 : 0) +
    (filters.hasLinkedCapsulation !== undefined ? 1 : 0)

  return (
    <div className="min-h-screen logo-bg-animation flex flex-col">
      <LiquidGlassNav />
      
      {/* Notification */}
      {notification && (
        <div 
          className={`fixed top-4 right-2 sm:right-4 left-2 sm:left-auto sm:w-auto z-50 p-3 sm:p-4 rounded-lg shadow-lg transition-apple ${
            notification.type === 'success' 
              ? 'bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800'
              : 'bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800'
          }`}
          role="alert"
        >
          <Text.Primary 
            className={`text-sm ${
              notification.type === 'success' ? 'text-success-700 dark:text-success-400' : 'text-danger-700 dark:text-danger-400'
            }`}
          >
            {notification.message}
          </Text.Primary>
        </div>
      )}
      
      <div className="pt-28 sm:pt-24 px-4 sm:px-6 md:px-8 space-y-8 floating-combined">
        {/* Hero Section */}
        <section className="liquid-glass-card liquid-glass-card-refraction liquid-glass-card-interactive p-6 md:p-8">
          <div className="liquid-glass-content flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <IconContainer 
                icon={Briefcase} 
                variant="primary" 
                size="md" 
                className="shadow-[0_12px_30px_rgba(59,130,246,0.25)]" 
              />
              <div>
                <Text.Primary as="h1" className="text-lg md:text-lg font-semibold tracking-tight">
                  工作單管理
                </Text.Primary>
                <Text.Secondary className="text-xs md:text-xs mt-0.5">
                  統一工作單系統 - 包裝、生產、倉務全流程管理
                </Text.Secondary>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <span className="px-3.5 py-1.5 rounded-full bg-success-500/15 border border-success-300/40 text-success-700 dark:text-success-400 text-sm font-medium leading-none">
                即時更新
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-primary-500/15 border border-primary-300/40 text-primary-700 dark:text-primary-400 text-sm font-medium leading-none">
                完整追蹤
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-info-500/15 border border-info-300/40 text-info-700 dark:text-info-400 text-sm font-medium leading-none">
                批量操作
              </span>
            </div>
          </div>
        </section>

        {/* Bulk Action Bar - appears when items selected */}
        <BulkActionBar
          selectedCount={selectedIds.length}
          onExport={() => setIsExportDialogOpen(true)}
          onDelete={handleBulkDeleteClick}
          onStatusChange={() => setIsBulkStatusDialogOpen(true)}
          onClearSelection={() => setSelectedIds([])}
        />

        {/* Header with Action Button */}
        <div className="mb-4 sm:mb-8">
          <div className="flex justify-end mb-4">
            <Button 
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg shadow-primary-500/30 transition-all duration-300 touch-feedback w-full sm:w-auto"
              onClick={() => router.push('/work-orders/new' as Route)}
            >
              <Plus className="h-4 w-4 mr-2" />
              新增工作單
            </Button>
          </div>

        {/* Stats */}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <Card className="card-interactive-apple transition-apple">
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6 pb-4 sm:pb-6">
                <Text.Primary as="div" className="text-xl sm:text-2xl font-bold">
                  {pagination.total}
                </Text.Primary>
                <Text.Secondary className="text-xs sm:text-sm">總工作單數</Text.Secondary>
              </CardContent>
            </Card>
            <Card className="card-interactive-apple transition-apple">
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6 pb-4 sm:pb-6">
                <Text.Success as="div" className="text-xl sm:text-2xl font-bold">
                  {workOrders.filter((wo: WorkOrder) => wo.isCompleted).length}
                </Text.Success>
                <Text.Secondary className="text-xs sm:text-sm">已完成</Text.Secondary>
              </CardContent>
            </Card>
            <Card className="card-interactive-apple transition-apple">
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6 pb-4 sm:pb-6">
                <Text.Warning as="div" className="text-xl sm:text-2xl font-bold">
                  {selectedIds.length}
                </Text.Warning>
                <Text.Secondary className="text-xs sm:text-sm">已選擇</Text.Secondary>
              </CardContent>
            </Card>
            <Card className="card-interactive-apple transition-apple">
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6 pb-4 sm:pb-6">
                <Text.Info as="div" className="text-xl sm:text-2xl font-bold">
                  {workOrders.filter((wo: WorkOrder) => wo.capsulationOrder).length}
                </Text.Info>
                <Text.Secondary className="text-xs sm:text-sm">已關聯訂單</Text.Secondary>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="px-3 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-base sm:text-lg">搜尋與篩選</CardTitle>
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="info" className="text-xs sm:text-sm">{activeFiltersCount} 個篩選條件</Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleClearAllFilters}
                  className="transition-apple text-xs sm:text-sm h-8 sm:h-auto"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  清除全部
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
          {/* Basic Search */}
          <div className="flex gap-2 flex-col sm:flex-row">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="搜尋訂單編號、客戶名稱..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 transition-apple text-sm"
              />
              <Button onClick={handleSearch} variant="default" className="transition-apple" size="sm">
                <Search className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">搜尋</span>
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`transition-apple flex-1 sm:flex-initial text-xs sm:text-sm ${activeFiltersCount > 1 ? 'border-primary-500 text-primary-600' : ''}`}
                size="sm"
              >
                <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                進階篩選
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsImportDialogOpen(true)}
                className="transition-apple hidden sm:flex"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                匯入
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsExportDialogOpen(true)}
                className="transition-apple"
                size="sm"
              >
                <FileDown className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">匯出</span>
              </Button>
            </div>
          </div>

          {/* Advanced Filters Panel - Simplified for mobile */}
          {showAdvancedFilters && (
            <div className="mt-4 p-3 sm:p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-surface-secondary/50 space-y-3 sm:space-y-4 transition-apple">
              {/* Smart Filters Section */}
              <SmartFilters
                activePreset={activeSmartFilter}
                onPresetSelect={handleSmartFilterSelect}
                onClearPreset={handleClearSmartFilter}
              />

              {/* Divider */}
              <div className="border-t border-neutral-200 dark:border-neutral-700 my-4" />

              <Text.Primary as="h4" className="font-medium mb-2 sm:mb-3 text-sm sm:text-base">進階篩選條件</Text.Primary>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Status Filter */}
                <div>
                  <Text.Primary as="label" className="block text-xs sm:text-sm font-medium mb-2">
                    狀態
                  </Text.Primary>
                  <Select
                    value={selectedStatuses[0] || ''}
                    onValueChange={(value) => {
                      if (value) {
                        setSelectedStatuses(prev => 
                          prev.includes(value as WorkOrderStatus) 
                            ? prev.filter(s => s !== value)
                            : [...prev, value as WorkOrderStatus]
                        )
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                      <SelectValue placeholder={selectedStatuses.length > 0 ? `已選 ${selectedStatuses.length} 個` : "選擇狀態"} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(WORK_ORDER_STATUS_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key} className="text-xs sm:text-sm">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Work Type Filter */}
                <div>
                  <Text.Primary as="label" className="block text-xs sm:text-sm font-medium mb-2">
                    工作類型
                  </Text.Primary>
                  <Select
                    value={selectedWorkTypes[0] || ''}
                    onValueChange={(value) => {
                      if (value) {
                        setSelectedWorkTypes(prev => 
                          prev.includes(value as WorkType) 
                            ? prev.filter(t => t !== value)
                            : [...prev, value as WorkType]
                        )
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                      <SelectValue placeholder={selectedWorkTypes.length > 0 ? `已選 ${selectedWorkTypes.length} 個` : "選擇類型"} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(WORK_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key} className="text-xs sm:text-sm">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Person in Charge Filter */}
                <div>
                  <Text.Primary as="label" className="block text-xs sm:text-sm font-medium mb-2">
                    負責人
                  </Text.Primary>
                  <Select
                    value={selectedPersons[0] || ''}
                    onValueChange={(value) => {
                      if (value) {
                        setSelectedPersons(prev => 
                          prev.includes(value) 
                            ? prev.filter(p => p !== value)
                            : [...prev, value]
                        )
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                      <SelectValue placeholder={selectedPersons.length > 0 ? `已選 ${selectedPersons.length} 個` : "選擇負責人"} />
                    </SelectTrigger>
                    <SelectContent>
                      {usersData?.map((user: { id: string, nickname?: string | null, phoneE164: string }) => (
                        <SelectItem key={user.id} value={user.id} className="text-xs sm:text-sm">
                          {user.nickname || user.phoneE164}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date From - Hidden on mobile, shown on desktop */}
                <div className="hidden sm:block">
                  <Text.Primary as="label" className="block text-xs sm:text-sm font-medium mb-2">
                    創建日期從
                  </Text.Primary>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="transition-apple h-9 sm:h-10 text-xs sm:text-sm"
                  />
                </div>

                {/* Date To - Hidden on mobile, shown on desktop */}
                <div className="hidden sm:block">
                  <Text.Primary as="label" className="block text-xs sm:text-sm font-medium mb-2">
                    創建日期至
                  </Text.Primary>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="transition-apple h-9 sm:h-10 text-xs sm:text-sm"
                  />
                </div>

                {/* VIP Filter */}
                <div>
                  <Text.Primary as="label" className="block text-xs sm:text-sm font-medium mb-2">
                    特殊標記
                  </Text.Primary>
                  <Select
                    value={vipOnly ? 'vip' : linkedOnly === true ? 'linked' : linkedOnly === false ? 'unlinked' : ''}
                    onValueChange={(value) => {
                      if (value === 'vip') {
                        setVipOnly(true)
                        setLinkedOnly(undefined)
                      } else if (value === 'linked') {
                        setVipOnly(false)
                        setLinkedOnly(true)
                      } else if (value === 'unlinked') {
                        setVipOnly(false)
                        setLinkedOnly(false)
                      } else {
                        setVipOnly(false)
                        setLinkedOnly(undefined)
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                      <SelectValue placeholder="選擇特殊標記" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs sm:text-sm">全部</SelectItem>
                      <SelectItem value="vip" className="text-xs sm:text-sm">VIP 訂單</SelectItem>
                      <SelectItem value="linked" className="text-xs sm:text-sm">已關聯訂單</SelectItem>
                      <SelectItem value="unlinked" className="text-xs sm:text-sm">未關聯訂單</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleApplyAdvancedFilters} variant="default" className="transition-apple flex-1 sm:flex-initial text-xs sm:text-sm h-9 sm:h-auto" size="sm">
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  套用篩選
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedStatuses([])
                    setSelectedWorkTypes([])
                    setSelectedPersons([])
                    setDateFrom('')
                    setDateTo('')
                    setVipOnly(false)
                    setLinkedOnly(undefined)
                  }}
                  className="transition-apple text-xs sm:text-sm h-9 sm:h-auto"
                  size="sm"
                >
                  重設
                </Button>
              </div>
            </div>
          )}

          {/* Active Filter Tags */}
          {activeFiltersCount > 0 && (
            <div className="mt-3 sm:mt-4 flex items-center gap-2 flex-wrap">
              <Text.Secondary as="span" className="text-xs sm:text-sm">已套用篩選:</Text.Secondary>
              
              {filters.keyword && (
                <Badge variant="info" className="inline-flex items-center gap-1 sm:gap-2 transition-apple hover:scale-105 text-xs">
                  關鍵字: {filters.keyword}
                  <button
                    onClick={() => {
                      setSearchKeyword('')
                      setFilters(prev => ({ ...prev, keyword: undefined, page: 1 }))
                    }}
                    className="hover:text-info-900 transition-apple"
                    aria-label="清除關鍵字篩選"
                  >
                    ×
                  </button>
                </Badge>
              )}

              {filters.status?.map(status => (
                <Badge key={status} variant="info" className="inline-flex items-center gap-1 sm:gap-2 transition-apple hover:scale-105 text-xs">
                  {WORK_ORDER_STATUS_LABELS[status]}
                  <button
                    onClick={() => {
                      setSelectedStatuses(prev => prev.filter(s => s !== status))
                      setFilters(prev => ({
                        ...prev,
                        status: prev.status?.filter(s => s !== status),
                        page: 1
                      }))
                    }}
                    className="hover:text-info-900 transition-apple"
                    aria-label={`清除${WORK_ORDER_STATUS_LABELS[status]}篩選`}
                  >
                    ×
                  </button>
                </Badge>
              ))}

              {filters.workType?.map(type => (
                <Badge key={type} variant="success" className="inline-flex items-center gap-1 sm:gap-2 transition-apple hover:scale-105 text-xs">
                  {WORK_TYPE_LABELS[type]}
                  <button
                    onClick={() => {
                      setSelectedWorkTypes(prev => prev.filter(t => t !== type))
                      setFilters(prev => ({
                        ...prev,
                        workType: prev.workType?.filter(t => t !== type),
                        page: 1
                      }))
                    }}
                    className="hover:text-success-900 transition-apple"
                    aria-label={`清除${WORK_TYPE_LABELS[type]}篩選`}
                  >
                    ×
                  </button>
                </Badge>
              ))}

              {filters.isVip && (
                <Badge variant="warning" className="inline-flex items-center gap-1 sm:gap-2 transition-apple hover:scale-105 text-xs">
                  VIP 訂單
                  <button
                    onClick={() => {
                      setVipOnly(false)
                      setFilters(prev => ({ ...prev, isVip: undefined, page: 1 }))
                    }}
                    className="hover:text-warning-900 transition-apple"
                    aria-label="清除VIP篩選"
                  >
                    ×
                  </button>
                </Badge>
              )}

              {filters.hasLinkedCapsulation !== undefined && (
                <Badge variant="info" className="inline-flex items-center gap-1 sm:gap-2 transition-apple hover:scale-105 text-xs">
                  {filters.hasLinkedCapsulation ? '已關聯訂單' : '未關聯訂單'}
                  <button
                    onClick={() => {
                      setLinkedOnly(undefined)
                      setFilters(prev => ({ ...prev, hasLinkedCapsulation: undefined, page: 1 }))
                    }}
                    className="hover:text-info-900 transition-apple"
                    aria-label="清除關聯狀態篩選"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="mb-4 sm:mb-6 border-danger-200 bg-danger-50 dark:bg-danger-900/20 dark:border-danger-800">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6 pb-4 sm:pb-6">
            <div className="flex items-center gap-2">
              <Text.Danger as="span" className="font-semibold text-sm sm:text-base">錯誤:</Text.Danger>
              <Text.Danger as="span" className="text-sm sm:text-base">{error instanceof Error ? error.message : '載入失敗'}</Text.Danger>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table - Mobile Optimized */}
      <Card>
        <CardContent className="pt-4 sm:pt-6 px-0 sm:px-6 pb-4 sm:pb-6">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle px-2 sm:px-0">
              <WorkOrderTable
                workOrders={workOrders}
                users={users}
                isLoading={isLoading}
                isFetching={isFetching}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onSort={handleSort}
                sortBy={filters.sortBy}
                sortOrder={filters.sortOrder}
                onDelete={handleDeleteClick}
                onRefresh={fetchWorkOrders}
              />
            </div>
          </div>

          {/* Pagination - Mobile Optimized */}
          {!isLoading && pagination.totalPages > 1 && (
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-2 sm:px-0">
              <Text.Secondary className="text-xs sm:text-sm text-center sm:text-left">
                顯示第 {((pagination.page - 1) * pagination.limit) + 1} 至{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} 項，
                共 {pagination.total} 項
              </Text.Secondary>
              <div className="flex gap-1 sm:gap-2 flex-wrap justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  aria-label="上一頁"
                  className="transition-apple h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  上一頁
                </Button>
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                    const pageNum = i + 1
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="min-w-[32px] sm:min-w-[40px] h-8 sm:h-9 transition-apple text-xs sm:text-sm"
                        aria-label={`前往第 ${pageNum} 頁`}
                        aria-current={pagination.page === pageNum ? 'page' : undefined}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                  {pagination.totalPages > 5 && (
                    <>
                      <Text.Tertiary as="span" className="px-1">...</Text.Tertiary>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.totalPages)}
                        className="min-w-[32px] sm:min-w-[40px] h-8 sm:h-9 transition-apple text-xs sm:text-sm"
                        aria-label={`前往第 ${pagination.totalPages} 頁`}
                      >
                        {pagination.totalPages}
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  aria-label="下一頁"
                  className="transition-apple h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  下一頁
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isFetching && '正在更新工作單列表'}
        {!isLoading && workOrders.length > 0 && `已載入 ${workOrders.length} 個工作單`}
        {!isLoading && workOrders.length === 0 && '沒有找到符合條件的工作單'}
      </div>
      
      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        selectedIds={selectedIds}
        totalCount={pagination.total}
      />
      
      {/* Import Dialog */}
      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImportSuccess={() => {
          // Refetch data after successful import
          setFilters(prev => ({ ...prev }))
          setSelectedIds([])
        }}
      />

      {/* Bulk Status Change Dialog */}
      <BulkStatusDialog
        isOpen={isBulkStatusDialogOpen}
        onClose={() => setIsBulkStatusDialogOpen(false)}
        selectedCount={selectedIds.length}
        onConfirm={handleBulkStatusChange}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmation.isOpen}
        onOpenChange={(open) => {
          console.log('[WorkOrders] ConfirmDialog onOpenChange called:', open)
          !open && setDeleteConfirmation({ isOpen: false, ids: [] })
        }}
        title="確認刪除"
        description={
          deleteConfirmation.ids.length === 1
            ? "確定要刪除此工作單嗎？此操作無法撤銷。"
            : `確定要刪除選中的 ${deleteConfirmation.ids.length} 個工作單嗎？此操作無法撤銷。`
        }
        onConfirm={handleDeleteConfirm}
        confirmLabel="刪除"
        cancelLabel="取消"
        variant="destructive"
      />

      {/* SmartAIAssistant - Floating AI Chat */}
      <SmartAIAssistant
        orders={workOrders.map((wo: WorkOrder) => ({
          id: wo.id,
          customerName: wo.customerName,
          productName: wo.workDescription,
          productionStatus: wo.status,
          createdAt: new Date(wo.createdAt || Date.now()),
          productionQuantity: 0,
          unitWeightMg: 0,
          batchTotalWeightMg: 0,
          updatedAt: new Date(wo.updatedAt || Date.now()),
          ingredients: []
        }))}
        pageData={{
          currentPage: '/work-orders',
          pageDescription: '工作單管理頁面 - 管理所有包裝、生產、倉務工作單',
          timestamp: new Date().toISOString(),
          ordersCount: pagination.total,
          hasCurrentOrder: false,
          currentOrder: null,
          recentOrders: workOrders.slice(0, 5).map((wo: WorkOrder) => ({
            id: wo.id,
            customerName: wo.customerName,
            productName: wo.workDescription,
            productionStatus: wo.status,
            createdAt: wo.createdAt?.toString() || new Date().toISOString(),
          })),
        }}
      />
      </div>
      <LiquidGlassFooter />
    </div>
  )
}
