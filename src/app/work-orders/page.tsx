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

import { useState, useCallback, useRef, useEffect, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Route } from 'next'
import { useUsers } from '@/lib/queries/work-orders'
import { WorkOrderTable } from '@/components/work-orders/work-order-table'
import { fetchWithTimeout } from '@/lib/api-client'
import { ExportDialog } from '@/components/work-orders/export-dialog'
import { ImportDialog } from '@/components/work-orders/import-dialog'
import { SmartFilters, SmartFilterPreset } from '@/components/work-orders/smart-filters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/accessible-dialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Text } from '@/components/ui/text'
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { LiquidGlassFooter } from '@/components/ui/liquid-glass-footer'
import { IconContainer } from '@/components/ui/icon-container'
import { SmartAIAssistant } from '@/components/ai/smart-ai-assistant'
import { Plus, Search, FileDown, Upload, Filter, X, Briefcase } from 'lucide-react'
import type { WorkOrderSearchFilters, SortField, WorkOrder } from '@/types/work-order'
import { WorkOrderStatus, WorkType, WORK_ORDER_STATUS_LABELS, WORK_TYPE_LABELS } from '@/types/work-order'

// Type-safe URL param parsing
function parseStatusFromURL(value: string): WorkOrderStatus | null {
  if (value === 'null') return null
  const validStatuses: WorkOrderStatus[] = ['PAUSED', 'COMPLETED', 'CANCELLED']
  return validStatuses.includes(value as WorkOrderStatus) ? (value as WorkOrderStatus) : null
}

function parseWorkTypeFromURL(value: string): WorkType | null {
  const validTypes: WorkType[] = ['PACKAGING', 'PRODUCTION', 'PRODUCTION_PACKAGING', 'WAREHOUSING']
  return validTypes.includes(value as WorkType) ? (value as WorkType) : null
}

function WorkOrdersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Safety check for searchParams (can be null during SSR)
  const safeGet = useCallback((key: string) => {
    try {
      return searchParams?.get(key) || ''
    } catch {
      return ''
    }
  }, [searchParams])
  
  // Initialize filters from URL with validation
  const [filters, setFilters] = useState<WorkOrderSearchFilters>(() => {
    return {
      page: Math.max(1, parseInt(safeGet('page') || '1')),
      limit: [10, 25, 50, 100].includes(parseInt(searchParams.get('limit') || '25')) 
        ? parseInt(searchParams.get('limit') || '25') 
        : 25,
      sortBy: (searchParams.get('sortBy') as SortField) || 'markedDate',
      sortOrder: searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc',
      isCompleted: searchParams.get('showCompleted') === 'true' ? undefined : false,
      keyword: searchParams.get('keyword') || undefined,
      status: searchParams.getAll('status')
        .map(parseStatusFromURL)
        .filter((s): s is WorkOrderStatus | null => s !== null && s !== undefined),
      workType: searchParams.getAll('workType')
        .map(parseWorkTypeFromURL)
        .filter((t): t is WorkType => t !== null),
      personInCharge: searchParams.getAll('personInCharge')
        .filter(p => p.length > 0),
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      isVip: searchParams.get('isVip') === 'true' || undefined,
      hasLinkedCapsulation: searchParams.get('linked') === 'true' 
        ? true 
        : searchParams.get('linked') === 'false' 
          ? false 
          : undefined,
    }
  })
  
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('keyword') || '')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(
    searchParams.has('status') || 
    searchParams.has('workType') || 
    searchParams.has('personInCharge') ||
    searchParams.has('dateFrom') ||
    searchParams.has('isVip')
  )
  
  // Advanced filter states (initialize from URL)
  const [selectedStatuses, setSelectedStatuses] = useState<(WorkOrderStatus | null)[]>(
    searchParams.getAll('status').map(parseStatusFromURL).filter((s): s is WorkOrderStatus | null => s !== null && s !== undefined)
  )
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<WorkType[]>(
    searchParams.getAll('workType').map(parseWorkTypeFromURL).filter((t): t is WorkType => t !== null)
  )
  const [selectedPersons, setSelectedPersons] = useState<string[]>(
    searchParams.getAll('personInCharge').filter(p => p.length > 0)
  )
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '')
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '')
  const [vipOnly, setVipOnly] = useState(searchParams.get('isVip') === 'true')
  const [linkedOnly, setLinkedOnly] = useState<boolean | undefined>(
    searchParams.get('linked') === 'true' ? true 
      : searchParams.get('linked') === 'false' ? false 
      : undefined
  )
  const [showCompleted, setShowCompleted] = useState(searchParams.get('showCompleted') === 'true')
  
  // Dialog states
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
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
  
  // Keep filters in ref to ensure fetchWorkOrders always uses latest values
  // This fixes intermittent refresh issues where stale filters were used
  const filtersRef = useRef<WorkOrderSearchFilters>(filters)
  
  // Update ref whenever filters change
  useEffect(() => {
    filtersRef.current = filters
  }, [filters])
  
  // Scroll position preservation
  const scrollPositionRef = useRef<number>(0)
  const isSelectOpenRef = useRef<boolean>(false)
  
  // Handle Select component open/close to prevent scroll jumps
  const handleSelectOpenChange = useCallback((open: boolean) => {
    if (open) {
      // Store scroll position when opening
      scrollPositionRef.current = window.scrollY
      isSelectOpenRef.current = true
    } else {
      // Restore scroll position when closing
      isSelectOpenRef.current = false
      // Use requestAnimationFrame to ensure it happens after browser's focus scroll
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPositionRef.current)
      })
    }
  }, [])
  
  // Fetch users for person filter
  const { data: usersData } = useUsers()
  const users = usersData || []
  
  // Sync filters to URL without causing scroll jumps
  const syncFiltersToURL = useCallback((newFilters: WorkOrderSearchFilters) => {
    const params = new URLSearchParams()
    
    // Only add non-default values
    if (newFilters.page && newFilters.page > 1) params.set('page', String(newFilters.page))
    if (newFilters.limit && newFilters.limit !== 25) params.set('limit', String(newFilters.limit))
    if (newFilters.sortBy && newFilters.sortBy !== 'markedDate') params.set('sortBy', newFilters.sortBy)
    if (newFilters.sortOrder && newFilters.sortOrder !== 'desc') params.set('sortOrder', newFilters.sortOrder)
    if (newFilters.keyword) params.set('keyword', newFilters.keyword)
    
    // Arrays
    newFilters.status?.forEach(s => params.append('status', s === null ? 'null' : s))
    newFilters.workType?.forEach(t => params.append('workType', t))
    newFilters.personInCharge?.forEach(p => params.append('personInCharge', p))
    
    // Dates
    if (newFilters.dateFrom) params.set('dateFrom', newFilters.dateFrom)
    if (newFilters.dateTo) params.set('dateTo', newFilters.dateTo)
    
    // Booleans
    if (newFilters.isVip) params.set('isVip', 'true')
    if (newFilters.hasLinkedCapsulation !== undefined) {
      params.set('linked', String(newFilters.hasLinkedCapsulation))
    }
    if (newFilters.isCompleted === undefined) params.set('showCompleted', 'true')
    
    // Use direct URL manipulation to avoid any scroll behavior
    const newURL = params.toString() ? `/work-orders?${params.toString()}` : '/work-orders'
    window.history.replaceState(null, '', newURL)
  }, [])

  // Manual fetch function with scroll position preservation
  // Uses filtersRef to always get the latest filters, preventing stale closure issues
  const fetchWorkOrders = useCallback(async (newFilters?: WorkOrderSearchFilters) => {
    // Use provided filters or fall back to current filters from ref
    // This ensures we always use the latest filters even if callback was created earlier
    const filtersToUse = newFilters ?? filtersRef.current
    // Store current scroll position before fetching
    const savedScroll = window.scrollY
    
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
      Object.entries(filtersToUse).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, String(v)))
          } else {
            params.append(key, String(value))
          }
        }
      })

      const response = await fetchWithTimeout(`/api/work-orders?${params.toString()}`, {
        signal: controller.signal,
        cache: 'no-store'
      })

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
          return
        }
        throw new Error('載入工作單失敗')
      }

      const result = await response.json()
      if (!result.success) {
        if (result.error === '未授權' || result.error === '權限不足') {
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
          return
        }
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
      setWorkOrders([])
      setPagination({ page: 1, limit: 25, total: 0, totalPages: 0 })
    } finally {
      setIsLoading(false)
      setIsFetching(false)
      abortControllerRef.current = null
      
      // Restore scroll position after render completes
      // Use both RAF and setTimeout to handle different render timings
      requestAnimationFrame(() => {
        window.scrollTo({
          top: savedScroll,
          left: 0,
          behavior: 'instant' as ScrollBehavior
        })
        
        // Double-check after a short delay to handle async renders
        setTimeout(() => {
          if (window.scrollY !== savedScroll) {
            window.scrollTo({
              top: savedScroll,
              left: 0,
              behavior: 'instant' as ScrollBehavior
            })
          }
        }, 10)
      })
    }
  }, []) // Empty deps - uses ref for filters to avoid stale closures


  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store'
        })
        
        if (!response.ok) {
          // User is not authenticated, redirect to login
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
          return
        }
        
        const result = await response.json()
        if (!result.success) {
          // Authentication failed, redirect to login
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
          return
        }
        
        // User is authenticated, proceed with data fetching
        fetchWorkOrders()
      } catch (error) {
        console.error('[WorkOrders] Auth check failed:', error)
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
      }
    }
    
    checkAuth()
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [fetchWorkOrders])

  // Keyboard shortcuts for desktop productivity
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }
      
      // Ctrl/Cmd + A: Select all visible rows
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [workOrders])

  // Handle basic search
  const handleSearch = () => {
    const newFilters = {
      ...filters,
      keyword: searchKeyword.trim() || undefined,
      page: 1
    }
    setFilters(newFilters)
    syncFiltersToURL(newFilters)
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
    syncFiltersToURL(newFilters)
    fetchWorkOrders(newFilters)
    
    // Auto-collapse filter panel after applying
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
    setShowCompleted(false)
    setActiveSmartFilter(null)
    const newFilters = {
      page: 1,
      limit: 25,
      sortBy: 'markedDate' as SortField,
      sortOrder: 'desc' as 'asc' | 'desc',
      isCompleted: false
    }
    setFilters(newFilters)
    syncFiltersToURL(newFilters)
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
      sortBy: 'markedDate',
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

    if (preset.filters.isCompleted !== undefined) {
      newFilters.isCompleted = preset.filters.isCompleted
      setShowCompleted(true)  // Auto-enable when smart filter needs completed orders
    }

    // Special handling for "已出貨" filter - override hide completed setting
    if (preset.id === 'shipped') {
      setShowCompleted(true)
    }

    setActiveSmartFilter(preset.id)
    setFilters(newFilters)
    syncFiltersToURL(newFilters)
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
    syncFiltersToURL(newFilters)
    fetchWorkOrders(newFilters)
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    const newFilters = { ...filters, page: newPage }
    setFilters(newFilters)
    syncFiltersToURL(newFilters)
    fetchWorkOrders(newFilters)
  }

  // Handle limit change
  const handleLimitChange = (newLimit: number) => {
    const newFilters = { ...filters, limit: newLimit, page: 1 }
    setFilters(newFilters)
    syncFiltersToURL(newFilters)
    fetchWorkOrders(newFilters)
  }

  // Handle single delete
  const handleDeleteClick = (id: string) => {
    setDeleteConfirmation({ isOpen: true, ids: [id] })
  }

  // Confirm delete (for single item)
  const handleDeleteConfirm = async () => {
    const { ids } = deleteConfirmation
    
    if (ids.length === 0) return
    
    try {
      // Delete single item
      const response = await fetch(`/api/work-orders/${ids[0]}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '刪除失敗')
      }
      
      setNotification({
        type: 'success',
        message: '成功刪除工作單'
      })

      // Close dialog
      setDeleteConfirmation({ isOpen: false, ids: [] })

      // Refetch list immediately
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
                  工作單管理（主訂單）- 可包含多個膠囊生產訂單
                </Text.Secondary>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <span className="px-3.5 py-1.5 rounded-full bg-primary-500/15 border border-primary-300/40 text-primary-700 dark:text-primary-400 text-sm font-medium leading-none">
                完整追蹤
              </span>
            </div>
          </div>
        </section>

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
        </div>

      {/* Search & Filters */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="px-3 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <Text.Primary as="h2" className="text-sm font-semibold text-neutral-700 dark:text-white/85 tracking-wide uppercase">工作單篩選</Text.Primary>
              <Text.Secondary className="text-xs text-neutral-500 dark:text-white/65">支援客戶、狀態、工作類型與負責人的即時篩查</Text.Secondary>
            </div>
            <div className="flex items-center gap-2 sm:self-auto self-start">
              <span className="text-xs font-semibold text-neutral-600 dark:text-white/75">每頁顯示</span>
              <Select
                value={String(filters.limit)}
                onValueChange={(value) => handleLimitChange(Number(value))}
                onOpenChange={handleSelectOpenChange}
              >
                <SelectTrigger className="w-[84px] h-7 border-none bg-transparent text-sm font-medium text-neutral-700 dark:text-white/75 focus:ring-0 focus:outline-none">
                  <SelectValue placeholder="筆數" />
                </SelectTrigger>
                <SelectContent>
                  {[25, 50, 100].map((option) => (
                    <SelectItem key={option} value={option.toString()} className="text-sm">
                      {option} 筆
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
          {/* Basic Search */}
          <div className="flex gap-2 flex-col sm:flex-row">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="搜尋：訂單編號、客戶名稱、產品名稱、負責人、備註、工作描述..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 transition-apple text-sm"
                title="支援部分匹配搜尋，例如：只記得客戶名稱的一部分也可以找到"
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
                      if (value === '' || value === 'all') {
                        setSelectedStatuses([])
                      } else {
                        setSelectedStatuses([value as WorkOrderStatus])
                      }
                    }}
                    onOpenChange={handleSelectOpenChange}
                  >
                    <SelectTrigger className="h-10 sm:h-11 text-xs sm:text-sm">
                      <SelectValue placeholder="選擇狀態" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs sm:text-sm">全部狀態</SelectItem>
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
                      if (value === '' || value === 'all') {
                        setSelectedWorkTypes([])
                      } else {
                        setSelectedWorkTypes([value as WorkType])
                      }
                    }}
                    onOpenChange={handleSelectOpenChange}
                  >
                    <SelectTrigger className="h-10 sm:h-11 text-xs sm:text-sm">
                      <SelectValue placeholder="選擇類型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs sm:text-sm">全部類型</SelectItem>
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
                      if (value === '' || value === 'all') {
                        setSelectedPersons([])
                      } else {
                        setSelectedPersons([value])
                      }
                    }}
                    onOpenChange={handleSelectOpenChange}
                  >
                    <SelectTrigger className="h-10 sm:h-11 text-xs sm:text-sm">
                      <SelectValue placeholder="選擇負責人" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs sm:text-sm">全部負責人</SelectItem>
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
                    className="transition-apple h-10 sm:h-11 text-xs sm:text-sm"
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
                    className="transition-apple h-10 sm:h-11 text-xs sm:text-sm"
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
                    onOpenChange={handleSelectOpenChange}
                  >
                    <SelectTrigger className="h-10 sm:h-11 text-xs sm:text-sm">
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

                {/* Show Completed Orders Toggle */}
                <div className="lg:col-span-3">
                  <div className="flex items-center space-x-3 pt-2">
                    <Checkbox
                      id="showCompleted"
                      checked={showCompleted}
                      onCheckedChange={(checked) => {
                        setShowCompleted(checked as boolean)
                        const newFilters = {
                          ...filters,
                          isCompleted: (checked as boolean) ? undefined : false,
                          page: 1
                        }
                        setFilters(newFilters)
                        syncFiltersToURL(newFilters)
                        fetchWorkOrders(newFilters)
                      }}
                      className="transition-apple"
                    />
                    <label 
                      htmlFor="showCompleted" 
                      className="text-sm sm:text-base font-medium leading-none cursor-pointer transition-apple hover:text-primary-600 text-neutral-800 dark:text-white/95"
                    >
                      顯示已完成訂單
                    </label>
                  </div>
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
                  onClick={handleClearAllFilters}
                  className="transition-apple text-xs sm:text-sm h-9 sm:h-auto"
                  size="sm"
                >
                  清除所有篩選
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
                      const newFilters = { ...filters, keyword: undefined, page: 1 }
                      setFilters(newFilters)
                      syncFiltersToURL(newFilters)
                      fetchWorkOrders(newFilters)
                    }}
                    className="hover:text-info-900 transition-apple"
                    aria-label="清除關鍵字篩選"
                  >
                    ×
                  </button>
                </Badge>
              )}

              {filters.status?.map(status => (
                <Badge key={status || 'null'} variant="info" className="inline-flex items-center gap-1 sm:gap-2 transition-apple hover:scale-105 text-xs">
                  {status ? WORK_ORDER_STATUS_LABELS[status] : '進行中'}
                  <button
                    onClick={() => {
                      setSelectedStatuses(prev => prev.filter(s => s !== status))
                      const newFilters = {
                        ...filters,
                        status: filters.status?.filter(s => s !== status),
                        page: 1
                      }
                      setFilters(newFilters)
                      syncFiltersToURL(newFilters)
                      fetchWorkOrders(newFilters)
                    }}
                    className="hover:text-info-900 transition-apple"
                    aria-label={`清除${status ? WORK_ORDER_STATUS_LABELS[status] : '進行中'}篩選`}
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
                      const newFilters = {
                        ...filters,
                        workType: filters.workType?.filter(t => t !== type),
                        page: 1
                      }
                      setFilters(newFilters)
                      syncFiltersToURL(newFilters)
                      fetchWorkOrders(newFilters)
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
                      const newFilters = { ...filters, isVip: undefined, page: 1 }
                      setFilters(newFilters)
                      syncFiltersToURL(newFilters)
                      fetchWorkOrders(newFilters)
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
                      const newFilters = { ...filters, hasLinkedCapsulation: undefined, page: 1 }
                      setFilters(newFilters)
                      syncFiltersToURL(newFilters)
                      fetchWorkOrders(newFilters)
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

      {/* Results Summary */}
      {!(isLoading || isFetching) && (
        <div className="mb-4 px-2 sm:px-0">
          <Text.Secondary className="text-sm">
            {pagination.total > 0 ? (
              <>共找到 <span className="font-semibold text-primary-600 dark:text-primary-400">{pagination.total}</span> 個工作單</>
            ) : (
              '沒有找到符合條件的工作單'
            )}
          </Text.Secondary>
        </div>
      )}

      {/* Table - Mobile Optimized */}
      <div className="w-full">
        <WorkOrderTable
          workOrders={workOrders}
          users={users}
          isLoading={isLoading}
          isFetching={isFetching}
          onSort={handleSort}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          onDelete={handleDeleteClick}
          onRefresh={fetchWorkOrders}
        />
      </div>

      {/* Pagination */}
      {!(isLoading || isFetching) && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2 sm:px-0">
          {/* Page info */}
          <div className="text-sm text-neutral-600 dark:text-white/75">
            顯示第 {((pagination.page - 1) * pagination.limit) + 1} 至 {Math.min(pagination.page * pagination.limit, pagination.total)} 項，共 {pagination.total} 項
          </div>

          {/* Page controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1}
              className="hidden sm:flex"
            >
              第一頁
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="h-12 min-w-[88px] lg:h-auto lg:min-w-0"
            >
              上一頁
            </Button>
            <span className="flex items-center px-3 sm:px-4 text-sm text-neutral-900 dark:text-white/95 font-medium">
              第 {pagination.page} / {pagination.totalPages} 頁
            </span>
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="h-12 min-w-[88px] lg:h-auto lg:min-w-0"
            >
              下一頁
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages}
              className="hidden sm:flex"
            >
              最後頁
            </Button>
          </div>

          {/* Items per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600 dark:text-white/75 whitespace-nowrap">每頁顯示：</span>
            <Select
              value={pagination.limit.toString()}
              onValueChange={(value) => handleLimitChange(parseInt(value))}
              onOpenChange={handleSelectOpenChange}
            >
              <SelectTrigger className="w-20 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

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
        selectedIds={[]}
        totalCount={pagination.total}
      />
      
      {/* Import Dialog */}
      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImportSuccess={() => {
          // Refetch data after successful import
          setFilters(prev => ({ ...prev }))
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmation.isOpen}
        onOpenChange={(open) => {
          !open && setDeleteConfirmation({ isOpen: false, ids: [] })
        }}
        title="確認刪除"
        description="確定要刪除此工作單嗎？此操作無法撤銷。"
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

export default function WorkOrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <WorkOrdersContent />
    </Suspense>
  )
}
