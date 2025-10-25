'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Clock, User, AlertCircle, CheckCircle, XCircle, ChevronLeft, ChevronRight, Filter, X, Edit, Trash, Eye, Plus, Download, Sparkles } from 'lucide-react'
import { IconContainer } from '@/components/ui/icon-container'

interface AuditLog {
  id: string
  userId: string | null
  phone: string | null
  action: string
  ip: string | null
  userAgent: string | null
  metadata: any
  createdAt: string
  user: {
    id: string
    phoneE164: string
    nickname: string | null
    role: string
  } | null
}

const actionNames: Record<string, string> = {
  // Authentication
  OTP_SENT: 'OTP 已發送',
  OTP_VERIFY_SUCCESS: 'OTP 驗證成功',
  OTP_VERIFY_FAIL: 'OTP 驗證失敗',
  LOGIN_SUCCESS: '登入成功',
  LOGOUT: '登出',
  SESSION_REFRESH: '會話刷新',
  DEVICE_TRUST_CREATED: '設備信任建立',
  DEVICE_TRUST_REVOKED: '設備信任撤銷',
  
  // User Management
  USER_CREATED: '創建用戶',
  USER_DELETED: '刪除用戶',
  ROLE_UPDATED: '角色更新',
  
  // Production Orders
  ORDER_CREATED: '創建訂單',
  ORDER_VIEWED: '查看訂單',
  ORDER_UPDATED: '更新訂單',
  ORDER_DELETED: '刪除訂單',
  ORDER_EXPORTED: '導出訂單',
  
  // Recipes
  RECIPE_CREATED: '創建配方',
  RECIPE_VIEWED: '查看配方',
  RECIPE_UPDATED: '更新配方',
  RECIPE_DELETED: '刪除配方',
  RECIPE_EXPORTED: '導出配方',
  
  // Work Logs
  WORKLOG_CREATED: '創建工作日誌',
  WORKLOG_UPDATED: '更新工作日誌',
  WORKLOG_DELETED: '刪除工作日誌',
  
  // Marketing
  MARKETING_GENERATED: '生成營銷內容',
  MARKETING_EXPORTED: '導出營銷內容',
  
  // AI Features
  AI_GRANULATION_ANALYZED: 'AI 製粒分析',
  AI_RECIPE_GENERATED: 'AI 生成配方',
  AI_CHAT_INTERACTION: 'AI 對話互動',
  AI_IMAGE_GENERATED: 'AI 生成圖片',
}

const actionIcons: Record<string, { icon: any; variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral' }> = {
  // Authentication
  OTP_SENT: { icon: FileText, variant: 'info' },
  OTP_VERIFY_SUCCESS: { icon: CheckCircle, variant: 'success' },
  OTP_VERIFY_FAIL: { icon: XCircle, variant: 'danger' },
  LOGIN_SUCCESS: { icon: CheckCircle, variant: 'success' },
  LOGOUT: { icon: AlertCircle, variant: 'warning' },
  SESSION_REFRESH: { icon: Clock, variant: 'info' },
  DEVICE_TRUST_CREATED: { icon: CheckCircle, variant: 'success' },
  DEVICE_TRUST_REVOKED: { icon: XCircle, variant: 'danger' },
  
  // User Management
  USER_CREATED: { icon: Plus, variant: 'success' },
  USER_DELETED: { icon: Trash, variant: 'danger' },
  ROLE_UPDATED: { icon: User, variant: 'warning' },
  
  // Production Orders
  ORDER_CREATED: { icon: Plus, variant: 'success' },
  ORDER_VIEWED: { icon: Eye, variant: 'info' },
  ORDER_UPDATED: { icon: Edit, variant: 'warning' },
  ORDER_DELETED: { icon: Trash, variant: 'danger' },
  ORDER_EXPORTED: { icon: Download, variant: 'info' },
  
  // Recipes
  RECIPE_CREATED: { icon: Plus, variant: 'success' },
  RECIPE_VIEWED: { icon: Eye, variant: 'info' },
  RECIPE_UPDATED: { icon: Edit, variant: 'warning' },
  RECIPE_DELETED: { icon: Trash, variant: 'danger' },
  RECIPE_EXPORTED: { icon: Download, variant: 'info' },
  
  // Work Logs
  WORKLOG_CREATED: { icon: Plus, variant: 'success' },
  WORKLOG_UPDATED: { icon: Edit, variant: 'warning' },
  WORKLOG_DELETED: { icon: Trash, variant: 'danger' },
  
  // Marketing
  MARKETING_GENERATED: { icon: Sparkles, variant: 'info' },
  MARKETING_EXPORTED: { icon: Download, variant: 'info' },
  
  // AI Features
  AI_GRANULATION_ANALYZED: { icon: Sparkles, variant: 'info' },
  AI_RECIPE_GENERATED: { icon: Sparkles, variant: 'success' },
  AI_CHAT_INTERACTION: { icon: Sparkles, variant: 'info' },
  AI_IMAGE_GENERATED: { icon: Sparkles, variant: 'success' },
}

interface AuditLogViewerProps {
  selectedUserId?: string | null
  onClearFilter?: () => void
}

export function AuditLogViewer({ selectedUserId, onClearFilter }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterAction, setFilterAction] = useState('')
  const [selectedUserPhone, setSelectedUserPhone] = useState<string>('')

  useEffect(() => {
    loadLogs()
  }, [page, filterAction, selectedUserId])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filterAction ? { action: filterAction } : {}),
        ...(selectedUserId ? { userId: selectedUserId } : {})
      })
      
      const res = await fetch(`/api/admin/audit-logs?${params}`)
      const data = await res.json()
      if (data.success) {
        setLogs(data.logs)
        setTotalPages(data.pagination.pages)
        
        // 獲取用戶電話號碼（用於顯示篩選標題）
        if (selectedUserId && data.logs.length > 0) {
          const phone = data.logs[0]?.user?.phoneE164 || data.logs[0]?.phone
          setSelectedUserPhone(phone || '')
        } else {
          setSelectedUserPhone('')
        }
      }
    } catch (error) {
      console.error('載入審計日誌失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && logs.length === 0) {
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
              <button
                onClick={onClearFilter}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-info-700 hover:bg-info-100 rounded transition-colors"
              >
                <X className="h-4 w-4" />
                顯示全部
              </button>
            )}
          </div>
        </Card>
      )}
      
      {/* Filter */}
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-xs">
          <select
            value={filterAction}
            onChange={(e) => {
              setFilterAction(e.target.value)
              setPage(1)
            }}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">所有操作</option>
            {Object.entries(actionNames).map(([key, name]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
        </div>
        
        <div className="text-sm text-neutral-600 dark:text-white/75">
          共 {logs.length} 條記錄
        </div>
      </div>

      {/* Logs */}
      <div className="space-y-2">
        {logs.map((log) => {
          const actionConfig = actionIcons[log.action] || { icon: FileText, variant: 'neutral' as const }
          
          return (
            <Card key={log.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <IconContainer 
                  icon={actionConfig.icon} 
                  variant={actionConfig.variant} 
                  size="sm" 
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-neutral-800 dark:text-white/95">
                      {actionNames[log.action] || log.action}
                    </span>
                    <span className="text-neutral-400 dark:text-white/55">·</span>
                    <span className="text-sm text-neutral-600 dark:text-white/75">
                      {log.user?.nickname ? (
                        <>
                          {log.user.nickname}
                          <span className="text-neutral-400 dark:text-white/55 ml-1">({log.user.phoneE164})</span>
                        </>
                      ) : (
                        log.user?.phoneE164 || log.phone || '未知用戶'
                      )}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-white/65">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.createdAt).toLocaleString('zh-HK')}
                      </div>
                      {log.ip && (
                        <div>IP: {log.ip}</div>
                      )}
                    </div>
                    {log.metadata && Object.keys(log.metadata as Record<string, any>).length > 0 && (
                      <div className="mt-2 p-2 bg-neutral-50 rounded text-xs">
                        <div className="space-y-0.5">
                          {Object.entries(log.metadata as Record<string, any>).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="text-neutral-500 dark:text-white/65 font-medium min-w-[80px]">{key}:</span>
                              <span className="text-neutral-700 dark:text-white/85">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {logs.length === 0 && (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 text-neutral-300 dark:text-white/55 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-white/75">暫無審計日誌</p>
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

