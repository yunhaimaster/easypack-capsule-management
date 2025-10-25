/**
 * Work Orders List Page
 * 
 * Production-ready list with:
 * - Advanced filtering (multiple criteria)
 * - Multi-column sorting
 * - Bulk actions (export, delete, status update)
 * - Order linking display
 * - Full responsive design
 * - Optimized for large datasets
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkOrders, useUsers } from '@/lib/queries/work-orders'
import { WorkOrderTable } from '@/components/work-orders/work-order-table'
import { ExportDialog } from '@/components/work-orders/export-dialog'
import { ImportDialog } from '@/components/work-orders/import-dialog'
import { BulkActionBar } from '@/components/work-orders/bulk-action-bar'
import { BulkStatusDialog } from '@/components/work-orders/bulk-status-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/accessible-dialog'
import { Plus, Search, FileDown, Upload, Filter, X } from 'lucide-react'
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
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // Fetch work orders
  const { data, isLoading, isFetching, error } = useWorkOrders(filters)
  
  // Fetch users for person filter
  const { data: usersData } = useUsers()

  const workOrders = data?.data?.workOrders || []
  const pagination = data?.data?.pagination || { page: 1, limit: 25, total: 0, totalPages: 0 }

  // Handle basic search
  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      keyword: searchKeyword.trim() || undefined,
      page: 1
    }))
  }

  // Apply advanced filters
  const handleApplyAdvancedFilters = () => {
    setFilters(prev => ({
      ...prev,
      status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      workType: selectedWorkTypes.length > 0 ? selectedWorkTypes : undefined,
      personInCharge: selectedPersons.length > 0 ? selectedPersons : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      isVip: vipOnly || undefined,
      hasLinkedCapsulation: linkedOnly,
      page: 1
    }))
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
    setFilters({
      page: 1,
      limit: 25,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
  }

  // Handle sort
  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field as SortField,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1
    }))
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  // Handle single delete
  const handleDeleteClick = (id: string) => {
    setDeleteConfirmation({ isOpen: true, ids: [id] })
  }

  // Handle bulk delete
  const handleBulkDeleteClick = () => {
    setDeleteConfirmation({ isOpen: true, ids: selectedIds })
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

      // Refetch data and clear selection
      setFilters(prev => ({ ...prev }))
      setSelectedIds([])
      setDeleteConfirmation({ isOpen: false, ids: [] })

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

      // Refetch data and clear selection
      setFilters(prev => ({ ...prev }))
      setSelectedIds([])
      setIsBulkStatusDialogOpen(false)

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
    } catch (error: unknown) {
      throw error // Let the dialog handle the error
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
    <div className="container mx-auto py-8 px-4">
      {/* Notification */}
      {notification && (
        <div 
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' 
              ? 'bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800 text-success-700 dark:text-success-400'
              : 'bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400'
          }`}
          role="alert"
        >
          {notification.message}
        </div>
      )}

      {/* Bulk Action Bar - appears when items selected */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        onExport={() => setIsExportDialogOpen(true)}
        onDelete={handleBulkDeleteClick}
        onStatusChange={() => setIsBulkStatusDialogOpen(true)}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white/95">工作單管理</h1>
            <p className="text-neutral-600 dark:text-white/75 mt-1">
              統一工作單系統 - 包裝、生產、倉務
            </p>
          </div>
          <Button 
            className="bg-primary-600 hover:bg-primary-700"
            onClick={() => router.push('/work-orders/new')}
          >
            <Plus className="h-4 w-4 mr-2" />
            新增工作單
          </Button>
        </div>

        {/* Stats */}
        {!isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-neutral-900 dark:text-white/95">
                  {pagination.total}
                </div>
                <p className="text-sm text-neutral-600 dark:text-white/75">總工作單數</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-success-600">
                  {workOrders.filter((wo: WorkOrder) => wo.isCompleted).length}
                </div>
                <p className="text-sm text-neutral-600 dark:text-white/75">已完成</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-warning-600">
                  {selectedIds.length}
                </div>
                <p className="text-sm text-neutral-600 dark:text-white/75">已選擇</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-info-600">
                  {workOrders.filter((wo: WorkOrder) => wo.capsulationOrder).length}
                </div>
                <p className="text-sm text-neutral-600 dark:text-white/75">已關聯訂單</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>搜尋與篩選</CardTitle>
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="info">{activeFiltersCount} 個篩選條件</Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleClearAllFilters}
                >
                  <X className="h-4 w-4 mr-1" />
                  清除全部
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Basic Search */}
          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="搜尋訂單編號、客戶名稱、工作描述..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} variant="default">
                <Search className="h-4 w-4 mr-2" />
                搜尋
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={activeFiltersCount > 1 ? 'border-primary-500 text-primary-600' : ''}
              >
                <Filter className="h-4 w-4 mr-2" />
                進階篩選
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsImportDialogOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                匯入
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsExportDialogOpen(true)}
              >
                <FileDown className="h-4 w-4 mr-2" />
                匯出
              </Button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="mt-6 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-surface-secondary/50 space-y-4">
              <h4 className="font-medium text-neutral-800 dark:text-white/95 mb-3">進階篩選條件</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                    狀態
                  </label>
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
                    <SelectTrigger>
                      <SelectValue placeholder={selectedStatuses.length > 0 ? `已選 ${selectedStatuses.length} 個` : "選擇狀態"} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(WORK_ORDER_STATUS_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Work Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                    工作類型
                  </label>
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
                    <SelectTrigger>
                      <SelectValue placeholder={selectedWorkTypes.length > 0 ? `已選 ${selectedWorkTypes.length} 個` : "選擇類型"} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(WORK_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Person in Charge Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                    負責人
                  </label>
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
                    <SelectTrigger>
                      <SelectValue placeholder={selectedPersons.length > 0 ? `已選 ${selectedPersons.length} 個` : "選擇負責人"} />
                    </SelectTrigger>
                    <SelectContent>
                      {usersData?.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.nickname || user.phoneE164}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date From */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                    創建日期從
                  </label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                    創建日期至
                  </label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>

                {/* VIP Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                    特殊標記
                  </label>
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
                    <SelectTrigger>
                      <SelectValue placeholder="選擇特殊標記" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="vip">VIP 訂單</SelectItem>
                      <SelectItem value="linked">已關聯訂單</SelectItem>
                      <SelectItem value="unlinked">未關聯訂單</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleApplyAdvancedFilters} variant="default">
                  <Filter className="h-4 w-4 mr-2" />
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
                >
                  重設
                </Button>
              </div>
            </div>
          )}

          {/* Active Filter Tags */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-neutral-600 dark:text-white/75">已套用篩選:</span>
              
              {filters.keyword && (
                <Badge variant="info" className="inline-flex items-center gap-2">
                  關鍵字: {filters.keyword}
                  <button
                    onClick={() => {
                      setSearchKeyword('')
                      setFilters(prev => ({ ...prev, keyword: undefined, page: 1 }))
                    }}
                    className="hover:text-info-900"
                    aria-label="清除關鍵字篩選"
                  >
                    ×
                  </button>
                </Badge>
              )}

              {filters.status?.map(status => (
                <Badge key={status} variant="info" className="inline-flex items-center gap-2">
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
                    className="hover:text-info-900"
                    aria-label={`清除${WORK_ORDER_STATUS_LABELS[status]}篩選`}
                  >
                    ×
                  </button>
                </Badge>
              ))}

              {filters.workType?.map(type => (
                <Badge key={type} variant="success" className="inline-flex items-center gap-2">
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
                    className="hover:text-success-900"
                    aria-label={`清除${WORK_TYPE_LABELS[type]}篩選`}
                  >
                    ×
                  </button>
                </Badge>
              ))}

              {filters.isVip && (
                <Badge variant="warning" className="inline-flex items-center gap-2">
                  VIP 訂單
                  <button
                    onClick={() => {
                      setVipOnly(false)
                      setFilters(prev => ({ ...prev, isVip: undefined, page: 1 }))
                    }}
                    className="hover:text-warning-900"
                    aria-label="清除VIP篩選"
                  >
                    ×
                  </button>
                </Badge>
              )}

              {filters.hasLinkedCapsulation !== undefined && (
                <Badge variant="info" className="inline-flex items-center gap-2">
                  {filters.hasLinkedCapsulation ? '已關聯訂單' : '未關聯訂單'}
                  <button
                    onClick={() => {
                      setLinkedOnly(undefined)
                      setFilters(prev => ({ ...prev, hasLinkedCapsulation: undefined, page: 1 }))
                    }}
                    className="hover:text-info-900"
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
        <Card className="mb-6 border-danger-200 bg-danger-50 dark:bg-danger-900/20 dark:border-danger-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-danger-700 dark:text-danger-400">
              <span className="font-semibold">錯誤:</span>
              <span>{error instanceof Error ? error.message : '載入失敗'}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <WorkOrderTable
            workOrders={workOrders}
            isLoading={isLoading}
            isFetching={isFetching}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onSort={handleSort}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onDelete={handleDeleteClick}
          />

          {/* Pagination */}
          {!isLoading && pagination.totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-neutral-600 dark:text-white/75">
                顯示第 {((pagination.page - 1) * pagination.limit) + 1} 至{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} 項，
                共 {pagination.total} 項
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  aria-label="上一頁"
                >
                  上一頁
                </Button>
                <div className="flex items-center gap-2">
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                    const pageNum = i + 1
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="min-w-[40px]"
                        aria-label={`前往第 ${pageNum} 頁`}
                        aria-current={pagination.page === pageNum ? 'page' : undefined}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                  {pagination.totalPages > 5 && (
                    <>
                      <span className="text-neutral-400 dark:text-white/55">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.totalPages)}
                        className="min-w-[40px]"
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

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-6 border-info-200 bg-info-50 dark:bg-info-900/20 dark:border-info-800">
          <CardHeader>
            <CardTitle className="text-info-700 dark:text-info-400">開發調試信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm font-mono">
              <div>
                <span className="text-neutral-600 dark:text-white/75">Loading:</span>{' '}
                <span className={isLoading ? 'text-warning-600' : 'text-success-600'}>
                  {isLoading ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-neutral-600 dark:text-white/75">Fetching:</span>{' '}
                <span className={isFetching ? 'text-warning-600' : 'text-success-600'}>
                  {isFetching ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-neutral-600 dark:text-white/75">Work Orders:</span>{' '}
                <span className="text-neutral-900 dark:text-white/95">{workOrders.length}</span>
              </div>
              <div>
                <span className="text-neutral-600 dark:text-white/75">Selected:</span>{' '}
                <span className="text-neutral-900 dark:text-white/95">{selectedIds.length}</span>
              </div>
              <div>
                <span className="text-neutral-600 dark:text-white/75">Active Filters:</span>{' '}
                <span className="text-neutral-900 dark:text-white/95">{activeFiltersCount}</span>
              </div>
              <div>
                <span className="text-neutral-600 dark:text-white/75">Current Page:</span>{' '}
                <span className="text-neutral-900 dark:text-white/95">{pagination.page} / {pagination.totalPages}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
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
        onOpenChange={(open) => !open && setDeleteConfirmation({ isOpen: false, ids: [] })}
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
    </div>
  )
}
