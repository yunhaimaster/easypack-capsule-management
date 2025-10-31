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
  ORDER_CREATED: '創建膠囊訂單',
  ORDER_VIEWED: '查看膠囊訂單',
  ORDER_UPDATED: '更新膠囊訂單',
  ORDER_DELETED: '刪除膠囊訂單',
  ORDER_EXPORTED: '導出膠囊訂單',
  
  // Work Orders
  WORK_ORDER_CREATED: '創建工作單',
  WORK_ORDER_VIEWED: '查看工作單',
  WORK_ORDER_UPDATED: '更新工作單',
  WORK_ORDER_DELETED: '刪除工作單',
  WORK_ORDER_EXPORTED: '導出工作單',
  WORK_ORDER_IMPORTED: '導入工作單',
  WORK_ORDER_BULK_UPDATED: '批量更新工作單',
  WORK_ORDER_STATUS_CHANGED: '工作單狀態變更',
  
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
  
  // Work Orders
  WORK_ORDER_CREATED: { icon: Plus, variant: 'success' },
  WORK_ORDER_VIEWED: { icon: Eye, variant: 'info' },
  WORK_ORDER_UPDATED: { icon: Edit, variant: 'warning' },
  WORK_ORDER_DELETED: { icon: Trash, variant: 'danger' },
  WORK_ORDER_EXPORTED: { icon: Download, variant: 'info' },
  WORK_ORDER_IMPORTED: { icon: Plus, variant: 'info' },
  WORK_ORDER_BULK_UPDATED: { icon: Edit, variant: 'warning' },
  WORK_ORDER_STATUS_CHANGED: { icon: Edit, variant: 'warning' },
  
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

/**
 * Format metadata for human-readable display
 * Converts machine IDs to readable labels and hides redundant ID fields when names exist
 */
function formatMetadata(metadata: Record<string, any>, action: string): Array<{ label: string; value: string }> {
  const result: Array<{ label: string; value: string }> = []
  const processed = new Set<string>()

  // Field label mappings (Chinese)
  const fieldLabels: Record<string, string> = {
    // Names and readable fields (HIGH PRIORITY - shown first)
    customerName: '客戶',
    productName: '產品',
    jobNumber: '訂單編號',
    workDescription: '工作描述',
    personInChargeName: '負責人',
    
    // Link-related names
    sourceName: '來源',
    sourceType: '來源類型',
    targetName: '目標',
    targetType: '目標類型',
    
    // Status and types
    status: '狀態',
    role: '角色',
    actionType: '操作類型',
    contextPage: '頁面',
    
    // Counts and quantities
    quantity: '數量',
    productionQuantity: '生產數量',
    ingredientCount: '原料數量',
    worklogCount: '工作日誌數量',
    workUnits: '工作單位',
    headcount: '人數',
    productionOrderCount: '關聯訂單數',
    
    // Other meaningful fields
    messageLength: '訊息長度',
    orderCount: '訂單數量',
    autoLinked: '自動關聯',
    autoCreated: '自動創建',
    
    // System IDs (will be filtered out)
    orderId: '訂單ID',
    workOrderId: '工作單ID',
    productionOrderId: '膠囊訂單ID',
    worklogId: '工作日誌ID',
    recipeId: '配方ID',
    sourceId: '來源ID',
    targetId: '目標ID',
    previousLink: '先前關聯ID',
  }

  // Type labels
  const typeLabels: Record<string, string> = {
    'encapsulation-order': '膠囊訂單',
    'work-order': '工作單',
    'production-order': '膠囊訂單',
  }

  // System IDs that should NEVER be displayed (completely filtered out)
  const idFields = ['sourceId', 'targetId', 'orderId', 'workOrderId', 'productionOrderId', 'worklogId', 'recipeId', 'previousLink', 'userId', 'id']
  
  // High-priority name fields (shown first, and hide their corresponding IDs)
  const nameFields = [
    'customerName', 'productName', 'jobNumber', 'personInChargeName', 
    'sourceName', 'targetName', 'workDescription'
  ]
  
  // Status and type fields
  const statusFields = ['status', 'role', 'actionType']
  
  // Count and quantity fields
  const countFields = ['quantity', 'productionQuantity', 'ingredientCount', 'worklogCount', 'productionOrderCount', 'orderCount', 'headcount']

  // First pass: Process high-priority name fields
  nameFields.forEach(nameField => {
    if (metadata[nameField] !== undefined && metadata[nameField] !== null) {
      const value = metadata[nameField]
      let label = fieldLabels[nameField] || nameField
      let displayValue = String(value)
      
      // Special formatting for source/target in link actions
      if ((nameField === 'sourceName' || nameField === 'targetName') && metadata[`${nameField.replace('Name', 'Type')}`]) {
        const type = metadata[`${nameField.replace('Name', 'Type')}`]
        label = nameField === 'sourceName' ? '來源' : '目標'
        displayValue = `${typeLabels[type] || type}：${value}`
      }
      
      result.push({ label, value: displayValue })
      processed.add(nameField)
      
      // Mark corresponding ID fields as processed (never show IDs when we have names)
      if (nameField === 'sourceName') {
        processed.add('sourceId')
      } else if (nameField === 'targetName') {
        processed.add('targetId')
      } else if (nameField === 'productName') {
        processed.add('orderId')
        processed.add('productionOrderId')
      } else if (nameField === 'customerName') {
        processed.add('orderId')
      } else if (nameField === 'jobNumber') {
        processed.add('workOrderId')
      }
    }
  })

  // Second pass: Process status and type fields
  statusFields.forEach(field => {
    if (metadata[field] !== undefined && metadata[field] !== null && !processed.has(field)) {
      const value = metadata[field]
      let displayValue = String(value)
      
      // Format type fields
      if (field.endsWith('Type') && typeLabels[displayValue]) {
        displayValue = typeLabels[displayValue]
      }
      
      result.push({ label: fieldLabels[field] || field, value: displayValue })
      processed.add(field)
    }
  })

  // Third pass: Process count and quantity fields
  countFields.forEach(field => {
    if (metadata[field] !== undefined && metadata[field] !== null && !processed.has(field)) {
      const value = metadata[field]
      const displayValue = typeof value === 'number' ? value.toLocaleString('zh-HK') : String(value)
      result.push({ label: fieldLabels[field] || field, value: displayValue })
      processed.add(field)
    }
  })

  // Fourth pass: Process remaining meaningful fields (excluding all IDs)
  Object.entries(metadata).forEach(([key, value]) => {
    if (processed.has(key)) return
    if (value === null || value === undefined) return
    // NEVER show system IDs
    if (idFields.includes(key)) return
    
    let label = fieldLabels[key] || key
    let displayValue: string

    // Format value based on type
    if (typeof value === 'object') {
      displayValue = JSON.stringify(value)
    } else if (typeof value === 'number') {
      displayValue = value.toLocaleString('zh-HK')
    } else if (typeof value === 'boolean') {
      displayValue = value ? '是' : '否'
    } else {
      displayValue = String(value)
      
      // Format type fields
      if (key.endsWith('Type') && typeLabels[displayValue]) {
        displayValue = typeLabels[displayValue]
      }
    }

    result.push({ label, value: displayValue })
  })

  return result
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
          本頁顯示 {logs.length} 條記錄
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
                      <div className="mt-2 p-2 bg-neutral-50 dark:bg-neutral-800/30 rounded text-xs">
                        <div className="space-y-0.5">
                          {formatMetadata(log.metadata as Record<string, any>, log.action).map((item, idx) => (
                            <div key={idx} className="flex gap-2">
                              <span className="text-neutral-500 dark:text-white/75 font-medium min-w-[80px]">{item.label}:</span>
                              <span className="text-neutral-700 dark:text-white/95">{item.value}</span>
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

