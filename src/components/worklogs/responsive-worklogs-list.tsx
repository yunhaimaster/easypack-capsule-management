'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'

import { CalendarDays, Clock3, ArrowUpDown, ArrowUp, ArrowDown, Download, Filter, RefreshCw, Loader2, ChevronDown, Pencil, Trash2 } from 'lucide-react'
import { DateTime } from 'luxon'

import { WorklogWithOrder } from '@/types'
import { WorklogFilter } from '@/components/worklogs/worklog-filter'
import { LiquidGlassLoading } from '@/components/ui/liquid-glass-loading'
import { useToast } from '@/components/ui/toast-provider'
import { fetchWithTimeout } from '@/lib/api-client'
import { IconContainer } from '@/components/ui/icon-container'
import { TableWrapper } from '@/components/ui/table-wrapper'
import { EditWorklogDialog } from './edit-worklog-dialog'
import { DeleteWorklogDialog } from './delete-worklog-dialog'

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function ResponsiveWorklogsList() {
  const { showToast } = useToast()
  const [worklogs, setWorklogs] = useState<WorklogWithOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const abortControllerRef = useRef<AbortController | null>(null)
  const [editingWorklog, setEditingWorklog] = useState<WorklogWithOrder | null>(null)
  const [deletingWorklog, setDeletingWorklog] = useState<WorklogWithOrder | null>(null)

  const [filters, setFilters] = useState({
    orderKeyword: '',
    notesKeyword: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 25
  })

  const fetchWorklogs = useCallback(async (newFilters = filters) => {
    setLoading(true)
    setError(null)
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      const controller = new AbortController()
      abortControllerRef.current = controller

      const params = new URLSearchParams()
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })
      params.set('sortOrder', sortOrder)

      const response = await fetchWithTimeout(`/api/worklogs?${params.toString()}`, {
        signal: controller.signal,
      })
      if (!response.ok) {
        throw new Error('載入工時紀錄失敗')
      }
      const payload = await response.json()
      if (!payload?.success) {
        throw new Error(payload?.error?.message || '載入工時紀錄失敗')
      }

      const data = payload.data
      const normalizedWorklogs = Array.isArray(data.worklogs)
        ? data.worklogs.map((log: any) => ({
            ...log,
            workDate: log.workDate,
          }))
        : []
      setWorklogs(normalizedWorklogs)
      setPagination(data.pagination)

    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') {
        return
      }
      console.error(err)
      const message = err instanceof Error ? err.message : '載入工時紀錄失敗'
      setError(message)
      showToast({
        title: '載入失敗',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [filters, sortOrder, showToast])

  useEffect(() => {
    fetchWorklogs()
    return () => abortControllerRef.current?.abort()
  }, [fetchWorklogs])

  const handleSearch = (newFilters: Partial<typeof filters>) => {
    const mergedFilters = {
      ...filters,
      ...newFilters,
      page: 1
    }
    setFilters(mergedFilters)
    fetchWorklogs(mergedFilters)
  }

  const handlePageChange = (page: number) => {
    if (!pagination) return
    const updatedFilters = { ...filters, page }
    setFilters(updatedFilters)
    fetchWorklogs(updatedFilters)
  }

  const handleLimitChange = (limit: number) => {
    const updatedFilters = { ...filters, limit, page: 1 }
    setFilters(updatedFilters)
    fetchWorklogs(updatedFilters)
  }

  const handleSortToggle = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  const handleExport = async () => {
    try {
      const response = await fetchWithTimeout('/api/worklogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format: 'csv',
          filters: {
            orderKeyword: filters.orderKeyword || undefined,
            notesKeyword: filters.notesKeyword || undefined,
            dateFrom: filters.dateFrom || undefined,
            dateTo: filters.dateTo || undefined,
            sortOrder
          }
        })
      })

      if (!response.ok) {
        throw new Error('匯出失敗，請稍後再試')
      }

      const blob = await response.blob()
      const filename = `worklogs-${new Date().toISOString().split('T')[0]}.csv`

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
      showToast({
        title: '匯出完成',
        description: '工時紀錄已匯出 CSV。'
      })
    } catch (err) {
      console.error('匯出錯誤:', err)
      showToast({
        title: '匯出失敗',
        description: err instanceof Error ? err.message : '匯出時發生錯誤，請稍後再試。',
        variant: 'destructive'
      })
    }
  }

  const sortIcon = useMemo(() => {
    if (sortOrder === 'asc') return <ArrowUp className="h-3 w-3" />
    if (sortOrder === 'desc') return <ArrowDown className="h-3 w-3" />
    return <ArrowUpDown className="h-3 w-3" />
  }, [sortOrder])

  const formatWorkDate = (value: string) => {
    const date = DateTime.fromISO(value, { zone: 'Asia/Hong_Kong' })
    if (!date.isValid) return value
    return date.toFormat('yyyy/MM/dd (ccc)', { locale: 'zh-Hant' })
  }

  const pageNumbers = useMemo(() => {
    if (!pagination) return []
    const pages: number[] = []
    for (let i = 1; i <= pagination.totalPages; i++) {
      pages.push(i)
    }
    return pages
  }, [pagination])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <WorklogFilter
          filters={filters}
          onSearch={handleSearch}
          onLimitChange={handleLimitChange}
          loading={loading}
        />
        <div className="flex justify-end">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-600 text-white text-sm font-medium shadow-[0_10px_30px_rgba(37,99,235,0.25)] hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            匯出 CSV
          </button>
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="table-scroll-container">
          <TableWrapper>
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-white/80 dark:bg-elevation-0/80">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-neutral-900 dark:text-white/95 text-sm">工時日期</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-900 dark:text-white/95 text-sm">訂單</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-900 dark:text-white/95 text-sm">工作時段</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-900 dark:text-white/95 text-sm">總工時</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-900 dark:text-white/95 text-sm">備註</th>
                <th className="text-center py-3 px-4 font-medium text-neutral-900 dark:text-white/95 text-sm">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-neutral-500 dark:text-white/65">載入中...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-danger-500">{error}</td>
                </tr>
              ) : worklogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-neutral-500 dark:text-white/65">目前沒有工時紀錄</td>
                </tr>
              ) : (
                worklogs.map((worklog) => (
                  <tr key={worklog.id} className="border-b border-neutral-100 hover:bg-white/80 transition-colors">
                    <td className="py-4 px-4 align-top text-sm text-neutral-800 dark:text-white/95 font-semibold text-neutral-900">
                      {formatWorkDate(worklog.workDate)}
                    </td>
                    <td className="py-4 px-4 align-top text-sm text-neutral-800 dark:text-white/95">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-neutral-900 dark:text-white/95">{worklog.order?.productName || '未指派訂單'}</span>
                        <span className="text-xs text-neutral-500 dark:text-white/65">客戶：{worklog.order?.customerName || '未填寫'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top text-sm text-neutral-800 dark:text-white/95">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-neutral-900 dark:text-white/95">
                          <Clock3 className="h-4 w-4 text-neutral-500 dark:text-white/65" />
                          {worklog.startTime} - {worklog.endTime}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-white/65">人數：{worklog.headcount} 人</div>
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top text-sm text-neutral-800 dark:text-white/95">
                      <span className="font-semibold text-neutral-900 dark:text-white/95">{worklog.calculatedWorkUnits.toFixed(1)} 工時</span>
                    </td>
                    <td className="py-4 px-4 align-top text-sm text-neutral-800 dark:text-white/95">
                      <div className="max-w-xs text-sm text-neutral-600 dark:text-white/75 leading-relaxed">
                        {worklog.notes ? worklog.notes : <span className="text-neutral-400 dark:text-white/55">無備註</span>}
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingWorklog(worklog)}
                          className="p-1.5 rounded-md hover:bg-info-50 text-info-600 hover:text-info-700 transition-colors"
                          aria-label="編輯工時記錄"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingWorklog(worklog)}
                          className="p-1.5 rounded-md hover:bg-danger-50 text-danger-600 hover:text-danger-700 transition-colors"
                          aria-label="刪除工時記錄"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </TableWrapper>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-neutral-600 dark:text-white/75">
            <span>
              第 {pagination.page} / {pagination.totalPages} 頁 · 共 {pagination.total} 筆工時紀錄
            </span>
            <div className="flex items-center gap-2">
              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                    pageNumber === pagination.page
                      ? 'border-primary-400 bg-primary-500/10 text-primary-700'
                      : 'border-white/60 dark:border-white/20 bg-surface-primary/50 dark:bg-elevation-1 text-neutral-600 dark:text-white/75 hover:border-primary-200 hover:text-primary-600'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="lg:hidden space-y-4">
        {loading ? (
          <div className="py-12">
            <LiquidGlassLoading title="載入工時" message="正在整理最新工時紀錄" />
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-danger-50 border border-red-100 p-6 text-sm text-danger-600">
            {error}
          </div>
        ) : worklogs.length === 0 ? (
          <div className="rounded-2xl bg-white/70 dark:bg-elevation-1 border border-white/60 dark:border-white/20 p-6 text-center text-sm text-neutral-500 dark:text-white/65">
            目前沒有工時紀錄
          </div>
        ) : (
          worklogs.map((worklog) => (
            <div key={worklog.id} className="liquid-glass-card liquid-glass-card-subtle">
              <div className="liquid-glass-content p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-400 dark:text-white/55">工時日期</p>
                    <h3 className="text-base font-semibold text-neutral-900">
                      {formatWorkDate(worklog.workDate)}
                    </h3>
                  </div>
                  <button
                    onClick={handleSortToggle}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/60 dark:bg-elevation-2 border border-white/70 dark:border-white/20 text-xs font-medium text-neutral-600 dark:text-white/75"
                  >
                    {sortIcon}
                    最新優先
                  </button>
                </div>

                <div className="rounded-2xl bg-white/75 border border-white/60 p-3 space-y-2">
                  <div className="font-medium text-neutral-900 dark:text-white/95">{worklog.order?.productName || '未指派訂單'}</div>
                  <div className="text-xs text-neutral-500 dark:text-white/65">客戶：{worklog.order?.customerName || '未填寫'}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-neutral-500 dark:text-white/65">
                  <div className="rounded-xl bg-white/75 border border-white/60 px-3 py-2">
                    <p className="uppercase tracking-[0.12em] text-[11px] text-neutral-400 dark:text-white/55 mb-1">工時範圍</p>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white/95">{worklog.startTime} - {worklog.endTime}</p>
                  </div>
                    <div className="rounded-xl bg-white/75 border border-white/60 px-3 py-2">
                    <p className="uppercase tracking-[0.12em] text-[11px] text-neutral-400 dark:text-white/55 mb-1">總工時</p>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white/95">{worklog.calculatedWorkUnits.toFixed(1)} 工時</p>
                  </div>
                </div>

                <div className="rounded-xl bg-gradient-to-r from-primary-500/15 via-primary-400/10 to-info-500/15 border border-primary-100 px-3 py-2 text-xs text-primary-600">
                  <p className="font-medium">備註</p>
                  <p className="mt-1 text-xs leading-relaxed text-primary-700">
                    {worklog.notes ? worklog.notes : '無備註'}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setEditingWorklog(worklog)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-info-50 border border-info-200 text-info-700 text-sm font-medium hover:bg-info-100 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                    編輯
                  </button>
                  <button
                    onClick={() => setDeletingWorklog(worklog)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-sm font-medium hover:bg-danger-100 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    刪除
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 text-sm text-neutral-600 dark:text-white/75">
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber)}
                className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                  pageNumber === pagination.page
                    ? 'border-primary-400 bg-primary-500/10 text-primary-700'
                    : 'border-white/60 dark:border-white/20 bg-surface-primary/50 dark:bg-elevation-1 text-neutral-600 dark:text-white/75 hover:border-primary-200 hover:text-primary-600'
                }`}
              >
                {pageNumber}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <EditWorklogDialog
        isOpen={!!editingWorklog}
        worklog={editingWorklog}
        onClose={() => setEditingWorklog(null)}
        onSuccess={fetchWorklogs}
      />
      <DeleteWorklogDialog
        isOpen={!!deletingWorklog}
        worklog={deletingWorklog}
        onClose={() => setDeletingWorklog(null)}
        onSuccess={fetchWorklogs}
      />
    </div>
  )
}

