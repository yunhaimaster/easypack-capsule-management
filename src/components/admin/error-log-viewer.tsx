'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, User, Filter, X, CheckCircle, ChevronLeft, ChevronRight, Search, Bug } from 'lucide-react'
import { IconContainer } from '@/components/ui/icon-container'
import { useAuth } from '@/components/auth/auth-provider'

interface ErrorLog {
  id: string
  userId: string | null
  severity: string
  message: string
  stack: string | null
  pageUrl: string | null
  apiRoute: string | null
  httpStatus: number | null
  userAgent: string | null
  ip: string | null
  metadata: any
  resolved: boolean
  createdAt: string
  user: {
    id: string
    phoneE164: string
    nickname: string | null
    role: string
  } | null
}

interface ErrorLogViewerProps {
  selectedUserId?: string | null
  onClearFilter?: () => void
}

export function ErrorLogViewer({ selectedUserId, onClearFilter }: ErrorLogViewerProps) {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterSeverity, setFilterSeverity] = useState('')
  const [filterResolved, setFilterResolved] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedUserPhone, setSelectedUserPhone] = useState<string>('')
  const { isAdmin } = useAuth()

  useEffect(() => {
    loadErrors()
  }, [page, filterSeverity, filterResolved, searchQuery, selectedUserId])

  const loadErrors = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '30',
        ...(filterSeverity ? { severity: filterSeverity } : {}),
        ...(filterResolved !== '' ? { resolved: filterResolved } : {}),
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(selectedUserId ? { userId: selectedUserId } : {})
      })
      
      const res = await fetch(`/api/admin/error-logs?${params}`)
      const data = await res.json()
      if (data.success) {
        setErrors(data.errors)
        setTotalPages(data.pagination.pages)
        
        // 獲取用戶電話號碼（用於顯示篩選標題）
        if (selectedUserId && data.errors.length > 0) {
          const phone = data.errors[0]?.user?.phoneE164
          setSelectedUserPhone(phone || '')
        } else {
          setSelectedUserPhone('')
        }
      }
    } catch (error) {
      console.error('載入錯誤日誌失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsResolved = async (id: string, resolved: boolean) => {
    try {
      const res = await fetch(`/api/admin/error-logs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved })
      })
      const data = await res.json()
      if (data.success) {
        // Update local state
        setErrors(errors.map(e => e.id === id ? { ...e, resolved } : e))
      } else {
        alert('更新失敗')
      }
    } catch (error) {
      console.error('標記錯誤失敗:', error)
      alert('標記失敗')
    }
  }

  const truncateMessage = (message: string, maxLength: number = 150) => {
    if (message.length <= maxLength) return message
    return message.substring(0, maxLength) + '...'
  }

  if (loading && errors.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
        <p className="mt-4 text-neutral-600 dark:text-white/75">載入中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Header */}
      {selectedUserId && selectedUserPhone && (
        <Card className="p-4 bg-info-50 border-info-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-info-600" />
              <span className="font-medium text-info-800">
                正在查看用戶：{selectedUserPhone}
              </span>
            </div>
            {onClearFilter && (
              <Button
                onClick={onClearFilter}
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 text-info-700 hover:bg-info-100"
              >
                <X className="h-4 w-4" />
                顯示全部
              </Button>
            )}
          </div>
        </Card>
      )}
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索錯誤訊息、URL..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        
        <select
          value={filterSeverity}
          onChange={(e) => {
            setFilterSeverity(e.target.value)
            setPage(1)
          }}
          className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">所有嚴重性</option>
          <option value="ERROR">錯誤</option>
          <option value="WARNING">警告</option>
        </select>
        
        <select
          value={filterResolved}
          onChange={(e) => {
            setFilterResolved(e.target.value)
            setPage(1)
          }}
          className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">所有狀態</option>
          <option value="false">未解決</option>
          <option value="true">已解決</option>
        </select>
      </div>

      {/* Errors */}
      <div className="space-y-2">
        {errors.map((error) => (
          <Card 
            key={error.id} 
            className={`p-4 transition-shadow ${
              error.resolved ? 'opacity-60' : 'hover:shadow-md'
            }`}
          >
            <div className="flex items-start gap-3">
              <IconContainer 
                icon={AlertTriangle} 
                variant={error.severity === 'ERROR' ? 'danger' : 'warning'} 
                size="sm" 
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant={error.severity === 'ERROR' ? 'danger' : 'warning'}>
                    {error.severity === 'ERROR' ? '錯誤' : '警告'}
                  </Badge>
                  {error.resolved && (
                    <Badge variant="neutral">已解決</Badge>
                  )}
                  {error.httpStatus && (
                    <Badge variant="neutral">HTTP {error.httpStatus}</Badge>
                  )}
                </div>
                
                <div className="mb-2">
                  <p className="text-sm font-medium text-neutral-800 dark:text-white/95 break-words">
                    {expandedId === error.id ? error.message : truncateMessage(error.message)}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-white/65 mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(error.createdAt).toLocaleString('zh-HK')}
                  </div>
                  {error.user && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>
                        {error.user.nickname ? (
                          <>
                            {error.user.nickname}
                            <span className="text-neutral-400 dark:text-white/55 ml-1">({error.user.phoneE164})</span>
                          </>
                        ) : (
                          error.user.phoneE164
                        )}
                      </span>
                    </div>
                  )}
                  {error.pageUrl && (
                    <div className="truncate max-w-xs" title={error.pageUrl}>
                      頁面: {error.pageUrl}
                    </div>
                  )}
                  {error.apiRoute && (
                    <div className="truncate max-w-xs" title={error.apiRoute}>
                      API: {error.apiRoute}
                    </div>
                  )}
                </div>

                {(error.stack || error.message.length > 150 || error.metadata) && (
                  <div>
                    {expandedId === error.id ? (
                      <div className="space-y-3">
                        {error.stack && (
                          <div className="bg-neutral-50 dark:bg-elevation-1 rounded-lg p-3">
                            <p className="text-xs font-medium text-neutral-700 dark:text-white/75 mb-2">堆疊追蹤</p>
                            <pre className="text-xs text-neutral-600 dark:text-white/85 whitespace-pre-wrap break-words font-mono">
                              {error.stack}
                            </pre>
                          </div>
                        )}
                        {error.metadata && (
                          <div className="bg-neutral-50 dark:bg-elevation-1 rounded-lg p-3">
                            <p className="text-xs font-medium text-neutral-700 dark:text-white/75 mb-2">詳細信息</p>
                            <pre className="text-xs text-neutral-600 dark:text-white/85 whitespace-pre-wrap break-words font-mono">
                              {JSON.stringify(error.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                        <Button
                          onClick={() => setExpandedId(null)}
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                        >
                          隱藏詳情
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setExpandedId(error.id)}
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                      >
                        查看詳情
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {isAdmin && (
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => markAsResolved(error.id, !error.resolved)}
                    variant={error.resolved ? 'secondary' : 'default'}
                    size="sm"
                    className="text-xs whitespace-nowrap"
                  >
                    {error.resolved ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        取消解決
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        標記解決
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {errors.length === 0 && (
        <Card className="p-12 text-center">
          <Bug className="h-12 w-12 text-neutral-300 dark:text-white/55 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-white/75">暫無錯誤記錄</p>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="secondary"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-neutral-600 dark:text-white/75">
            第 {page} / {totalPages} 頁
          </span>
          
          <Button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            variant="secondary"
            size="sm"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

