'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Download, Brain, BookmarkPlus, Lock, Unlock, Link2 } from 'lucide-react'
import { formatDateOnly, formatNumber, formatIngredientWeight, convertWeight, calculateBatchWeight } from '@/lib/utils'
import { ProductionOrder, OrderWorklog, RecipeLibraryItem } from '@/types'
import { OrderAIAssistant } from '@/components/ai/order-ai-assistant'
import { LiquidGlassFooter } from '@/components/ui/liquid-glass-footer'
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { LiquidGlassLoading } from '@/components/ui/liquid-glass-loading'
import { ExportConfirmationDialog } from '@/components/granulation/export-confirmation-dialog'
import { exportOrderToGranulation, validateOrderForGranulation } from '@/lib/granulation-export'
import { useToast } from '@/components/ui/toast-provider'
import { SaveRecipeDialog } from '@/components/recipe-library/save-recipe-dialog'
import { OrderLockDialog } from '@/components/orders/order-lock-dialog'
import { useAuth } from '@/components/auth/auth-provider'
import { Text } from '@/components/ui/text'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { UserLink } from '@/components/ui/user-link'
import { OrderLinkBadge } from '@/components/ui/order-link-badge'
import { LinkOrderModal } from '@/components/orders/link-order-modal'
import { LiquidGlassConfirmModal } from '@/components/ui/liquid-glass-modal'
import { WORK_TYPE_LABELS } from '@/types/work-order'
import Link from 'next/link'
import { Unlink } from 'lucide-react'
import { sumWorkUnits } from '@/lib/worklog'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const { isAdmin } = useAuth()
  const [order, setOrder] = useState<ProductionOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showSaveRecipeDialog, setShowSaveRecipeDialog] = useState(false)
  const [canSaveRecipe, setCanSaveRecipe] = useState(false)
  const [existingRecipe, setExistingRecipe] = useState<RecipeLibraryItem | null>(null)
  const [alreadyRecorded, setAlreadyRecorded] = useState(false)
  const [showLockDialog, setShowLockDialog] = useState(false)
  const [showPasswordVerifyDialog, setShowPasswordVerifyDialog] = useState(false)
  const [lockDialogMode, setLockDialogMode] = useState<'set' | 'change' | 'verify'>('set')
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false)

  useEffect(() => {
    const id = params?.id as string | undefined
    if (id && typeof id === 'string' && id !== 'undefined') {
      fetchOrder(id)
    } else if (id === 'undefined' || !id) {
      setError('訂單ID無效')
      setLoading(false)
    }
  }, [params?.id])

  // Check if order can be saved as recipe
  useEffect(() => {
    const id = params?.id as string | undefined
    if (order && id && typeof id === 'string' && id !== 'undefined') {
      checkRecipeSaveStatus(id)
    }
  }, [order, params?.id])

  const checkRecipeSaveStatus = async (orderId: string) => {
    try {
      const response = await fetch(`/api/recipes/from-order/${orderId}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        setCanSaveRecipe(result.data.canSave)
        setExistingRecipe(result.data.existingRecipe)
        setAlreadyRecorded(result.data.alreadyRecorded || false)
      }
    } catch (error) {
      console.error('Check recipe status error:', error)
    }
  }

  const fetchOrder = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders/${id}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('訂單不存在')
        } else {
          setError('載入訂單失敗')
        }
        return
      }
      
      const data = await response.json()
      setOrder(data)
    } catch (error) {
      console.error('載入訂單錯誤:', error)
      setError('載入訂單失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleUnlink = async () => {
    if (!order) return
    
    try {
      const response = await fetch(`/api/orders/${order.id}/link`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        showToast({ title: '已取消關聯' })
        fetchOrder(order.id)
      } else {
        showToast({ title: result.error || '取消關聯失敗', variant: 'destructive' })
      }
    } catch (error) {
      showToast({ title: '取消關聯失敗', variant: 'destructive' })
    } finally {
      setShowUnlinkConfirm(false)
    }
  }

  // Keyboard shortcut for opening link modal (Cmd/Ctrl+K)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (order && !order.workOrder) {
          setLinkModalOpen(true)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [order])

  const handleExportClick = () => {
    if (!order) return

    const validation = validateOrderForGranulation(order)
    if (!validation.valid) {
      showToast({
        title: '無法匯出',
        description: validation.message || '此訂單無法進行製粒分析',
        variant: 'destructive'
      })
      return
    }

    setShowExportDialog(true)
  }

  const handleExportConfirm = () => {
    if (!order) return

    try {
      exportOrderToGranulation(order)
      // Navigation will happen in exportOrderToGranulation
    } catch (error) {
      showToast({
        title: '匯出失敗',
        description: error instanceof Error ? error.message : '匯出配方時發生錯誤',
        variant: 'destructive'
      })
    }
    setShowExportDialog(false)
  }

  const handleSaveRecipeSuccess = (recipe: RecipeLibraryItem) => {
    showToast({
      title: '保存成功',
      description: existingRecipe 
        ? `已更新配方「${recipe.recipeName}」的生產記錄`
        : `配方「${recipe.recipeName}」已保存到配方庫`,
      variant: 'default'
    })
    // Refresh recipe status
    const id = params?.id as string | undefined
    if (id && typeof id === 'string' && id !== 'undefined') {
      checkRecipeSaveStatus(id)
    }
  }

  const handleEditClick = async () => {
    if (!order) return
    
    // 直接跳轉編輯頁 - 密碼驗證在編輯頁面內處理
    router.push(`/orders/${order.id}/edit`)
  }

  const handlePasswordVerifySuccess = (password?: string) => {
    // 密碼驗證成功，跳轉到編輯頁並攜帶驗證令牌
    if (password) {
      const token = btoa(password) // 簡單的 base64 編碼
      router.push(`/orders/${order?.id}/edit?token=${token}`)
    } else {
      router.push(`/orders/${order?.id}/edit`)
    }
  }

  const handleLockDialogSuccess = () => {
    // 密碼鎖操作成功，刷新訂單數據
    const id = params?.id as string | undefined
    if (id && typeof id === 'string' && id !== 'undefined') {
      fetchOrder(id)
    }
  }

  const handleSetPassword = () => {
    setLockDialogMode('set')
    setShowLockDialog(true)
  }

  const handleChangePassword = () => {
    setLockDialogMode('change')
    setShowLockDialog(true)
  }

  const handleRemovePassword = async () => {
    if (!order) return
    
    try {
      const response = await fetch(`/api/orders/${order.id}/lock`, {
        method: 'DELETE',
      })
      const data = await response.json()
      
      if (response.ok && data.success) {
        showToast({
          title: '解鎖成功',
          description: '密碼保護已移除',
          variant: 'default'
        })
        // 刷新訂單數據
        const id = params?.id as string | undefined
        if (id && typeof id === 'string' && id !== 'undefined') {
          fetchOrder(id)
        }
      } else {
        showToast({
          title: '解鎖失敗',
          description: data.error || '移除密碼保護失敗',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Remove password error:', error)
      showToast({
        title: '解鎖失敗',
        description: '網路錯誤，請稍後再試',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <LiquidGlassLoading
        title="載入訂單詳情"
        message="資料正在整理，請稍候…"
      />
    )
  }

  if (error || !order) {
    return (
      <div className="brand-logo-bg-animation min-h-screen flex flex-col">
        <LiquidGlassNav />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="liquid-glass-card liquid-glass-card-brand liquid-glass-card-refraction max-w-md w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-danger-600">載入失敗</CardTitle>
              <CardDescription>{error || '訂單不存在'}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/orders">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  返回生產記錄
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <LiquidGlassFooter className="w-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen brand-logo-bg-animation flex flex-col">
      {/* Liquid Glass Navigation */}
      <LiquidGlassNav />

      {/* Main Content */}
      <main className="flex-1 w-full pt-20 sm:pt-24 pb-16">
        <div className="mx-auto w-full max-w-6xl space-y-8 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24">
          {/* 操作按鈕 */}
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 relative z-[2000]">
            <OrderAIAssistant order={order} />
            {canSaveRecipe && (
              <Button
                onClick={() => setShowSaveRecipeDialog(true)}
                className="ripple-effect btn-micro-hover bg-info-600 hover:bg-info-700 touch-target text-sm sm:text-base px-3 sm:px-4"
              >
                <BookmarkPlus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">
                  {existingRecipe ? (alreadyRecorded ? '已在配方庫' : '更新配方') : '保存配方'}
                </span>
              </Button>
            )}
            <Button
              onClick={() => setShowExportDialog(true)}
              className="ripple-effect btn-micro-hover bg-info-600 hover:bg-info-700 touch-target text-sm sm:text-base px-3 sm:px-4"
            >
              <Brain className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">製粒分析</span>
            </Button>
            
            {/* 密碼鎖控制 - 只有當有客戶指定原料時才顯示 */}
            {order.ingredients?.some(ingredient => ingredient.isCustomerProvided) && (
              <>
                {order.lockPassword ? (
                  // 已鎖定
                  <>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      已鎖定
                    </Badge>
                    {isAdmin && (
                      <>
                        <Button
                          onClick={handleChangePassword}
                          variant="outline"
                          className="ripple-effect btn-micro-hover touch-target text-sm sm:text-base px-3 sm:px-4"
                        >
                          <Unlock className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">修改密碼</span>
                        </Button>
                        <Button
                          onClick={handleRemovePassword}
                          variant="destructive"
                          className="ripple-effect btn-micro-hover touch-target text-sm sm:text-base px-3 sm:px-4"
                        >
                          <Unlock className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">解鎖</span>
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  // 未鎖定
                  <Button
                    onClick={handleSetPassword}
                    variant="outline"
                    className="ripple-effect btn-micro-hover touch-target text-sm sm:text-base px-3 sm:px-4"
                  >
                    <Unlock className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">設定密碼保護</span>
                  </Button>
                )}
              </>
            )}
            
            <Button
              onClick={handleEditClick}
              className="ripple-effect btn-micro-hover bg-primary-600 hover:bg-primary-700 touch-target text-sm sm:text-base px-3 sm:px-4"
            >
              <Edit className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">編輯</span>
            </Button>
            <Link href="/orders">
              <Button variant="outline" className="ripple-effect btn-micro-hover touch-target text-sm sm:text-base px-3 sm:px-4">
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">返回</span>
              </Button>
            </Link>
          </div>

          {/* 基本資訊 */}
          <Card className="liquid-glass-card liquid-glass-card-brand liquid-glass-card-refraction">
            <CardHeader>
              <CardTitle className="text-lg md:text-lg flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-xl">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                </div>
                <span className="text-[--brand-neutral]">基本資訊</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="liquid-glass-card liquid-glass-card-subtle p-4 rounded-2xl space-y-3">
                  <h4 className="font-medium text-[--brand-neutral] flex items-center gap-2 text-xs md:text-sm">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-primary-500 text-[11px] font-semibold">客</span>
                    客戶資訊
                  </h4>
                  <div className="grid grid-cols-1 gap-1 text-xs md:text-sm text-neutral-700 dark:text-white/85">
                    <p><span className="font-medium text-neutral-900 dark:text-white/95">客戶名稱：</span>{order.customerName}</p>
                    <p><span className="font-medium text-neutral-900 dark:text-white/95">產品名字：</span>{order.productName}</p>
                    <p><span className="font-medium text-neutral-900 dark:text-white/95">訂單數量：</span>{formatNumber(order.productionQuantity)} 粒</p>
                    <p><span className="font-medium text-neutral-900 dark:text-white/95">實際生產數量：</span>{order.actualProductionQuantity != null ? formatNumber(order.actualProductionQuantity) + ' 粒' : '—'}</p>
                    <p><span className="font-medium text-neutral-900 dark:text-white/95">材料可做數量：</span>{order.materialYieldQuantity != null ? formatNumber(order.materialYieldQuantity) + ' 粒' : '—'}</p>
                    <p><span className="font-medium text-neutral-900 dark:text-white/95">客服：</span>
                      {order.customerService 
                        ? (typeof order.customerService === 'object' && order.customerService !== null
                          ? ((order.customerService as { nickname?: string | null; phoneE164?: string }).nickname || 
                             (order.customerService as { nickname?: string | null; phoneE164?: string }).phoneE164 || 
                             '未知客服')
                          : String(order.customerService))
                        : '未填寫'}
                    </p>
                  </div>
                </div>

                <div className="liquid-glass-card liquid-glass-card-subtle p-4 rounded-2xl space-y-3">
                  <h4 className="font-medium text-[--brand-neutral] flex items-center gap-2 text-xs md:text-sm">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success-100 text-success-500 text-[11px] font-semibold">狀</span>
                    生產狀態
                  </h4>
                  <div className="grid grid-cols-1 gap-1 text-xs md:text-sm text-neutral-700 dark:text-white/85">
                    <p><span className="font-medium text-neutral-900">完工日期：</span>{order.completionDate ? formatDateOnly(order.completionDate) : '未完工'}</p>
                    <p><span className="font-medium text-neutral-900">累積工時：</span>{order.worklogs && order.worklogs.length > 0 ? `${sumWorkUnits(order.worklogs as OrderWorklog[]).toFixed(1)} 工時` : '—'}</p>
                    <p><span className="font-medium text-neutral-900">工時狀態：</span>
                      {order.worklogs && order.worklogs.length > 0
                        ? order.completionDate
                          ? '已完工'
                          : '進行中'
                        : '未開始'}</p>
                    <p><span className="font-medium text-neutral-900">單粒總重量：</span>{order.unitWeightMg.toFixed(3)} mg</p>
                    <p><span className="font-medium text-neutral-900">批次總重量：</span>{convertWeight(order.batchTotalWeightMg).display}</p>
                  </div>
                </div>
              </div>

              {(order.capsuleColor || order.capsuleSize || order.capsuleType) && (
                <div className="liquid-glass-card liquid-glass-card-subtle p-4 rounded-2xl space-y-3">
                  <h4 className="font-medium text-[--brand-neutral] flex items-center gap-2 text-xs md-text-sm">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-info-100 dark:bg-info-900/30 text-info-600 dark:text-info-400 text-[11px] font-semibold">膠</span>
                    膠囊規格
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs md:text-sm text-neutral-700 dark:text-white/85">
                    {order.capsuleColor && (
                      <p><span className="font-medium text-neutral-900">顏色：</span>{order.capsuleColor}</p>
                    )}
                    {order.capsuleSize && (
                      <p><span className="font-medium text-neutral-900">大小：</span>{order.capsuleSize}</p>
                    )}
                    {order.capsuleType && (
                      <p><span className="font-medium text-neutral-900">成份：</span>{order.capsuleType}</p>
                    )}
                  </div>
                </div>
              )}

              {(order.processIssues || order.qualityNotes) && (
                <div className="liquid-glass-card liquid-glass-card-subtle p-4 rounded-2xl space-y-3">
                  <h4 className="font-medium text-[--brand-neutral] flex items-center gap-2 text-xs md-text-sm">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400 text-[11px] font-semibold">備</span>
                    備註資訊
                  </h4>
                  <div className="space-y-3 text-xs md:text-sm text-neutral-700 dark:text-white/85">
                    {order.processIssues && (
                      <Card variant="glass" tone="negative" interactive={false} className="p-3">
                        <span className="font-medium text-danger-700 dark:text-danger-400 block mb-1">製程問題</span>
                        <p className="leading-relaxed text-danger-600 dark:text-danger-300 text-sm">{order.processIssues}</p>
                      </Card>
                    )}
                    {order.qualityNotes && (
                      <Card variant="glass" tone="positive" interactive={false} className="p-3">
                        <span className="font-medium text-success-700 dark:text-success-400 block mb-1">品管備註</span>
                        <p className="leading-relaxed text-success-600 dark:text-success-300 text-sm">{order.qualityNotes}</p>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked Work Order */}
          {order.workOrder ? (
            <Card className="liquid-glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-info-600 dark:text-info-400" />
                    關聯工作單
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/work-orders/${order.workOrder!.id}`)}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1 rotate-180" />
                      查看
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUnlinkConfirm(true)}
                      className="text-warning-600 hover:text-warning-700 dark:text-warning-400 dark:hover:text-warning-300"
                    >
                      <Unlink className="h-4 w-4 mr-1" />
                      取消關聯
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <OrderLinkBadge
                    type="work-order"
                    orderId={order.workOrder.id}
                    label={order.workOrder.jobNumber || `工作單 - ${order.workOrder.customerName}`}
                    size="md"
                  />
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">
                    <p>客戶名稱: {order.workOrder.customerName}</p>
                    <p>工作類型: {WORK_TYPE_LABELS[order.workOrder.workType]}</p>
                  </div>
                  {order.customerName !== order.workOrder.customerName && (
                    <Badge variant="warning" className="mt-2">
                      ⚠ 客戶名稱不匹配
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="liquid-glass-card border-dashed border-2">
              <CardContent className="pt-6 pb-6 text-center">
                <Link2 className="h-12 w-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-3" />
                <Text.Secondary className="mb-4">
                  此訂單尚未關聯工作單
                </Text.Secondary>
                <Button onClick={() => setLinkModalOpen(true)}>
                  <Link2 className="h-4 w-4 mr-2" />
                  關聯工作單
                </Button>
                <Text.Tertiary className="mt-3 text-xs">
                  或按 Cmd+K 快速開啟
                </Text.Tertiary>
              </CardContent>
            </Card>
          )}

          {/* 原料配方明細 */}
          <Card className="liquid-glass-card liquid-glass-card-brand liquid-glass-card-refraction">
            <CardHeader>
              <CardTitle className="text-lg md:text-lg flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-success-500 to-teal-500 rounded-xl">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <span style={{ color: '#2a588c' }}>原料配方明細</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="hidden md:block table-scroll-container">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sm">原料品名</TableHead>
                      <TableHead className="text-sm">單粒含量 (mg)</TableHead>
                      <TableHead className="text-sm">客戶指定</TableHead>
                      <TableHead className="text-sm">原料來源</TableHead>
                      <TableHead className="text-sm">批次用量</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.ingredients.map((ingredient, index) => (
                      <TableRow key={index}>
                        <TableCell>{ingredient.materialName}</TableCell>
                        <TableCell>{formatIngredientWeight(ingredient.unitContentMg)}</TableCell>
                        <TableCell>
                          {ingredient.isCustomerProvided ? (
                            <span className="inline-flex items-center gap-1 text-success-600 text-xs sm:text-sm">
                              <span className="h-2 w-2 rounded-full bg-success-500" />
                              客戶指定
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-primary-500 text-xs sm:text-sm">
                              <span className="h-2 w-2 rounded-full bg-primary-400" />
                              自行添加
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {ingredient.isCustomerSupplied ? (
                            <span className="inline-flex items-center gap-1 text-success-600 text-xs sm:text-sm">
                              <span className="h-2 w-2 rounded-full bg-success-500" />
                              客戶提供
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-primary-500 text-xs sm:text-sm">
                              <span className="h-2 w-2 rounded-full bg-primary-400" />
                              公司提供
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {calculateBatchWeight(ingredient.unitContentMg, order.productionQuantity).display}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {order.ingredients.map((ingredient, index) => (
                  <Card
                    key={index}
                    variant="glass"
                    interactive={false}
                    className="p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-base font-semibold text-neutral-800 dark:text-white/95 leading-tight flex-1">
                        {ingredient.materialName}
                      </h4>
                      <div className="flex flex-col items-end gap-1.5 text-xs font-medium flex-shrink-0">
                        <span className={`inline-flex items-center gap-1.5 ${ingredient.isCustomerProvided ? 'text-success-600 dark:text-success-400' : 'text-primary-500 dark:text-primary-400'}`}>
                          <span className={`h-2 w-2 rounded-full ${ingredient.isCustomerProvided ? 'bg-success-500' : 'bg-primary-400'}`} />
                          {ingredient.isCustomerProvided ? '客戶指定' : '自行添加'}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 ${ingredient.isCustomerSupplied ? 'text-success-600 dark:text-success-400' : 'text-primary-500 dark:text-primary-400'}`}>
                          <span className={`h-2 w-2 rounded-full ${ingredient.isCustomerSupplied ? 'bg-success-500' : 'bg-primary-400'}`} />
                          {ingredient.isCustomerSupplied ? '客戶提供' : '公司提供'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 dark:text-white/55 mb-1">單粒含量</span>
                        <span className="text-base font-semibold text-neutral-900 dark:text-white/95">
                          {formatIngredientWeight(ingredient.unitContentMg)} mg
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 dark:text-white/55 mb-1">批次用量</span>
                        <span className="text-base font-semibold text-neutral-900 dark:text-white/95">
                          {calculateBatchWeight(ingredient.unitContentMg, order.productionQuantity).display}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 工時紀錄 */}
          <Card className="liquid-glass-card liquid-glass-card-brand liquid-glass-card-refraction">
            <CardHeader>
              <CardTitle className="text-lg md:text-lg flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM14 19a2 2 0 10-4 0 2 2 0 004 0m5-8a2 2 0 10-4 0 2 2 0 004 0" />
                  </svg>
                </div>
                <span style={{ color: '#4f46e5' }}>工時紀錄</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.worklogs && order.worklogs.length > 0 ? (
                <>
                  <div className="hidden md:block table-scroll-container">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-sm">日期</TableHead>
                          <TableHead className="text-sm">人數</TableHead>
                          <TableHead className="text-sm">開始時間</TableHead>
                          <TableHead className="text-sm">結束時間</TableHead>
                          <TableHead className="text-sm">工時 (工時)</TableHead>
                          <TableHead className="text-sm">備註</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.worklogs.map((worklog, index) => (
                          <TableRow key={index}>
                            <TableCell>{formatDateOnly(worklog.workDate)}</TableCell>
                            <TableCell>{worklog.headcount}</TableCell>
                            <TableCell>{worklog.startTime}</TableCell>
                            <TableCell>{worklog.endTime}</TableCell>
                            <TableCell>{worklog.calculatedWorkUnits.toFixed(1)}</TableCell>
                            <TableCell>{worklog.notes || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="md:hidden space-y-4">
                    {order.worklogs.map((worklog, index) => (
                      <Card key={index} variant="glass" interactive={false} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-base font-semibold text-neutral-800 dark:text-white/95 leading-tight flex-1">
                            {formatDateOnly(worklog.workDate)}
                          </h4>
                          <div className="flex flex-col items-end gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 dark:text-white/55 flex-shrink-0">
                            <span className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full">工時：{worklog.calculatedWorkUnits.toFixed(1)} 工時</span>
                            <span className="bg-neutral-50 dark:bg-elevation-2 text-neutral-700 dark:text-white/75 px-2 py-1 rounded-full">人數：{worklog.headcount}</span>
                          </div>
                        </div>
                        <div className="text-sm text-neutral-700 dark:text-white/75 space-y-2 leading-relaxed">
                          <p><span className="font-medium text-neutral-900 dark:text-white/95">時間：</span>{worklog.startTime} - {worklog.endTime}</p>
                          {worklog.notes && (
                            <p className="bg-warning-50 dark:bg-warning-900/20 border border-warning-100 dark:border-warning-800 rounded-lg p-2">
                              <span className="font-medium text-warning-900 dark:text-warning-300">備註：</span>
                              <span className="text-warning-800 dark:text-warning-200">{worklog.notes}</span>
                            </p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-neutral-500 dark:text-white/65">暫無工時記錄。</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <LiquidGlassFooter className="w-full" />

      {/* Export Confirmation Dialog */}
      <ExportConfirmationDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onConfirm={handleExportConfirm}
        order={order}
      />

      {/* Save Recipe Dialog */}
      <SaveRecipeDialog
        open={showSaveRecipeDialog}
        onOpenChange={setShowSaveRecipeDialog}
        orderId={order.id}
        orderData={{
          customerName: order.customerName,
          productName: order.productName,
          ingredientCount: order.ingredients.length,
          existingNotes: existingRecipe?.notes || undefined,
          processIssues: order.processIssues || undefined,
          qualityNotes: order.qualityNotes || undefined
        }}
        existingRecipe={existingRecipe}
        alreadyRecorded={alreadyRecorded}
        onSuccess={handleSaveRecipeSuccess}
      />

      {/* Password Lock Dialog */}
      <OrderLockDialog
        open={showLockDialog}
        onOpenChange={setShowLockDialog}
        mode={lockDialogMode}
        orderId={order.id}
        onSuccess={handleLockDialogSuccess}
      />

      {/* Password Verify Dialog */}
      <OrderLockDialog
        open={showPasswordVerifyDialog}
        onOpenChange={setShowPasswordVerifyDialog}
        mode="verify"
        orderId={order.id}
        onSuccess={handlePasswordVerifySuccess}
      />

      {/* Link Order Modal */}
      <LinkOrderModal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        sourceType="encapsulation-order"
        sourceId={order.id}
        sourceName={order.productName}
        currentLink={order.workOrder ? {
          id: order.workOrder.id,
          name: order.workOrder.jobNumber || order.workOrder.customerName
        } : null}
        onLinkComplete={() => {
          setLinkModalOpen(false)
          fetchOrder(order.id)
        }}
      />

      {/* Unlink Confirmation Modal */}
      <LiquidGlassConfirmModal
        isOpen={showUnlinkConfirm}
        onClose={() => setShowUnlinkConfirm(false)}
        onConfirm={handleUnlink}
        title="確認取消關聯"
        message={`確定要取消與工作單「${order.workOrder?.jobNumber || order.workOrder?.customerName}」的關聯嗎？`}
        confirmText="取消關聯"
        variant="danger"
      />
    </div>
  )
}
