/**
 * Work Orders List Page (Minimal Version)
 * 
 * Minimal working implementation to test end-to-end:
 * - Backend API connection
 * - React Query data fetching
 * - Table display with real data
 * - Basic filtering
 * - Loading states
 */

'use client'

import { useState } from 'react'
import { useWorkOrders, useUsers } from '@/lib/queries/work-orders'
import { WorkOrderTable } from '@/components/work-orders/work-order-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, FileDown, Upload } from 'lucide-react'
import Link from 'next/link'
import type { WorkOrderSearchFilters } from '@/types/work-order'

export default function WorkOrdersPage() {
  // Search filters state
  const [filters, setFilters] = useState<WorkOrderSearchFilters>({
    page: 1,
    limit: 25,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Fetch work orders
  const { data, isLoading, isFetching, error } = useWorkOrders(filters)
  
  // Fetch users for future use
  const { data: usersData } = useUsers()

  const workOrders = data?.data?.workOrders || []
  const pagination = data?.data?.pagination || { page: 1, limit: 25, total: 0, totalPages: 0 }

  // Handle search
  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      keyword: searchKeyword,
      page: 1
    }))
  }

  // Handle sort
  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field as any,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1
    }))
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">工作單管理</h1>
            <p className="text-neutral-600 mt-1">
              統一工作單系統 - 包裝、生產、倉務
            </p>
          </div>
          <Button asChild className="bg-primary-600 hover:bg-primary-700">
            <Link href="/orders/new">
              <Plus className="h-4 w-4 mr-2" />
              新增工作單
            </Link>
          </Button>
        </div>

        {/* Stats */}
        {!isLoading && (
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-neutral-900">
                  {pagination.total}
                </div>
                <p className="text-sm text-neutral-600">總工作單數</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-success-600">
                  {usersData?.length || 0}
                </div>
                <p className="text-sm text-neutral-600">系統用戶數</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-warning-600">
                  {selectedIds.length}
                </div>
                <p className="text-sm text-neutral-600">已選擇</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-info-600">
                  {pagination.totalPages}
                </div>
                <p className="text-sm text-neutral-600">總頁數</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Search & Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>搜尋與篩選</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="搜尋 JOB標號、客戶名稱、工作描述..."
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
              <Button variant="outline" disabled>
                <Upload className="h-4 w-4 mr-2" />
                匯入
              </Button>
              <Button variant="outline" disabled>
                <FileDown className="h-4 w-4 mr-2" />
                匯出
              </Button>
            </div>
          </div>
          
          {/* Active Filters */}
          {filters.keyword && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-neutral-600">搜尋關鍵字:</span>
              <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm">
                {filters.keyword}
                <button
                  onClick={() => {
                    setSearchKeyword('')
                    setFilters(prev => ({ ...prev, keyword: undefined, page: 1 }))
                  }}
                  className="hover:text-primary-900"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-danger-200 bg-danger-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-danger-700">
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
          />

          {/* Pagination */}
          {!isLoading && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-neutral-600">
                顯示第 {((pagination.page - 1) * pagination.limit) + 1} 至{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} 項，
                共 {pagination.total} 項
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
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
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                  {pagination.totalPages > 5 && (
                    <>
                      <span className="text-neutral-400">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.totalPages)}
                        className="min-w-[40px]"
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
                >
                  下一頁
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-6 border-info-200 bg-info-50">
          <CardHeader>
            <CardTitle className="text-info-700">開發調試信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm font-mono">
              <div>
                <span className="text-neutral-600">Loading:</span>{' '}
                <span className={isLoading ? 'text-warning-600' : 'text-success-600'}>
                  {isLoading ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-neutral-600">Fetching:</span>{' '}
                <span className={isFetching ? 'text-warning-600' : 'text-success-600'}>
                  {isFetching ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-neutral-600">Work Orders:</span>{' '}
                <span className="text-neutral-900">{workOrders.length}</span>
              </div>
              <div>
                <span className="text-neutral-600">Users Available:</span>{' '}
                <span className="text-neutral-900">{usersData?.length || 0}</span>
              </div>
              <div>
                <span className="text-neutral-600">Selected:</span>{' '}
                <span className="text-neutral-900">{selectedIds.length}</span>
              </div>
              <div>
                <span className="text-neutral-600">Current Page:</span>{' '}
                <span className="text-neutral-900">{pagination.page} / {pagination.totalPages}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

