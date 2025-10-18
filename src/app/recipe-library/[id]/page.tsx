'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { LiquidGlassFooter } from '@/components/ui/liquid-glass-footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Beaker,
  Package,
  TrendingUp,
  Calendar,
  Eye,
  PlusCircle,
  Loader2,
  ExternalLink,
  Edit,
  Sparkles,
  Brain,
  RefreshCw,
  Trash2
} from 'lucide-react'
import { IconContainer } from '@/components/ui/icon-container'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast-provider'
import type { RecipeLibraryItem } from '@/types'
import { EditRecipeDialog } from '@/components/recipe-library/edit-recipe-dialog'
import { cn } from '@/lib/utils'

export default function RecipeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { showToast } = useToast()
  const [recipe, setRecipe] = useState<RecipeLibraryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [editNotesOpen, setEditNotesOpen] = useState(false)
  const [editingNotes, setEditingNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [reanalyzing, setReanalyzing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [syncingNotes, setSyncingNotes] = useState(false)
  const [editRecipeOpen, setEditRecipeOpen] = useState(false) // 🆕 編輯配方對話框狀態

  const fetchRecipe = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/recipes/${params.id}`)
      const result = await response.json()

      if (result.success) {
        setRecipe(result.data)
      } else {
        showToast({
          title: '載入失敗',
          description: result.error || '無法載入配方詳情',
          variant: 'destructive'
        })
        router.push('/recipe-library')
      }
    } catch (error) {
      console.error('Fetch recipe error:', error)
      showToast({
        title: '載入失敗',
        description: '無法連接到服務器',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [params.id, showToast, router])

  useEffect(() => {
    fetchRecipe()
  }, [fetchRecipe])

  const handleCreateOrder = async () => {
    try {
      if (!recipe) return
      
      // 先調用 use API 更新使用統計
      await fetch(`/api/recipes/${params.id}/use`)
      
      // 🆕 根據配方類型選擇不同的跳轉方式
      if (recipe.recipeType === 'template') {
        // 模板配方：使用 fromTemplate 參數
        router.push(`/orders/new?fromTemplate=${params.id}`)
      } else {
        // 生產配方：使用 recipeId 參數
        router.push(`/orders/new?recipeId=${params.id}`)
      }
    } catch (error) {
      console.error('Create order error:', error)
      showToast({
        title: '操作失敗',
        description: '無法創建訂單',
        variant: 'destructive'
      })
    }
  }

  const handleEditNotes = () => {
    setEditingNotes(recipe?.notes || '')
    setEditNotesOpen(true)
  }

  const handleSaveNotes = async () => {
    if (!recipe) return
    
    try {
      setSavingNotes(true)
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: editingNotes })
      })

      const result = await response.json()
      
      if (result.success) {
        showToast({
          title: '備註已更新',
          description: '生產備註已成功保存'
        })
        setEditNotesOpen(false)
        fetchRecipe() // 重新加載配方數據
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Save notes error:', error)
      showToast({
        title: '保存失敗',
        description: error instanceof Error ? error.message : '無法保存備註',
        variant: 'destructive'
      })
    } finally {
      setSavingNotes(false)
    }
  }

  const handleExportToMarketing = () => {
    if (!recipe) return
    
    const ingredientsData = recipe.ingredients.map(ing => ({
      materialName: ing.materialName,
      unitContentMg: ing.unitContentMg
    }))
    
    localStorage.setItem('marketing_imported_ingredients', JSON.stringify(ingredientsData))
    router.push('/marketing-assistant')
  }

  const handleReanalyze = async () => {
    if (!recipe) return
    
    try {
      setReanalyzing(true)
      const response = await fetch(`/api/recipes/${recipe.id}/analyze-effects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()
      
      if (result.success) {
        showToast({
          title: 'AI 分析完成',
          description: '功效分析已更新'
        })
        fetchRecipe() // 重新加載配方數據
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Reanalyze error:', error)
      showToast({
        title: '分析失敗',
        description: error instanceof Error ? error.message : 'AI 分析失敗',
        variant: 'destructive'
      })
    } finally {
      setReanalyzing(false)
    }
  }

  const handleSyncNotes = async () => {
    if (!recipe) return

    try {
      setSyncingNotes(true)
      const response = await fetch(`/api/recipes/${recipe.id}/sync-notes`, {
        method: 'POST' 
      })

      const result = await response.json()

      if (result.success) {
        showToast({
          title: '備註已同步',
          description: result.message || '已同步來源訂單備註'
        })
        fetchRecipe()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Sync notes error:', error)
      showToast({
        title: '同步失敗',
        description: error instanceof Error ? error.message : '無法同步備註',
        variant: 'destructive'
      })
    } finally {
      setSyncingNotes(false)
    }
  }

  const handleDelete = async () => {
    if (!recipe) return
    
    try {
      setDeleting(true)
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (result.success) {
        showToast({
          title: '配方已刪除',
          description: '配方已從配方庫中移除'
        })
        router.push('/recipe-library')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Delete error:', error)
      showToast({
        title: '刪除失敗',
        description: error instanceof Error ? error.message : '無法刪除配方',
        variant: 'destructive'
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen logo-bg-animation flex flex-col">
        <LiquidGlassNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-info-600 mb-4" />
            <p className="text-neutral-600">載入配方中...</p>
          </div>
        </main>
        <LiquidGlassFooter />
      </div>
    )
  }

  if (!recipe) {
    return null
  }

  return (
    <div className="min-h-screen logo-bg-animation flex flex-col">
      <LiquidGlassNav />

      <main className="flex-1">
        <div className="pt-28 sm:pt-24 px-4 sm:px-6 md:px-8 space-y-8 pb-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <Link href="/recipe-library">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                返回配方庫
              </Button>
            </Link>
            <Button 
              variant="destructive" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              刪除配方
            </Button>
          </div>

          {/* Title Card */}
          <Card className="liquid-glass-card liquid-glass-card-elevated">
            <div className="liquid-glass-content">
              <div className="flex flex-col lg:flex-row items-start gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <IconContainer 
                    icon={Beaker} 
                    variant="info" 
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h1 className="text-xl sm:text-2xl font-bold text-neutral-800">
                        {recipe.recipeName}
                      </h1>
                      {/* 🆕 编辑按钮（只显示在模板配方） */}
                      {recipe.recipeType === 'template' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditRecipeOpen(true)}
                          className="flex items-center gap-2 transition-apple"
                        >
                          <Edit className="h-4 w-4" />
                          編輯配方
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-neutral-600">
                      <span>客戶：{recipe.customerName}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>產品：{recipe.productName}</span>
                    </div>
                    {/* 🆕 配方類型與來源徽章 */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Badge 
                        variant={recipe.recipeType === 'production' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {recipe.recipeType === 'production' ? '生產配方' : '模板配方'}
                      </Badge>
                      {recipe.sourceType === 'order' && (
                        <Badge variant="outline" className="text-xs">訂單生成</Badge>
                      )}
                      {recipe.sourceType === 'batch_import' && (
                        <Badge variant="outline" className="text-xs">批量導入</Badge>
                      )}
                      {recipe.sourceType === 'manual' && (
                        <Badge variant="outline" className="text-xs">手動創建</Badge>
                      )}
                    </div>
                    {recipe.description && (
                      <p className="mt-3 text-sm text-neutral-600">{recipe.description}</p>
                    )}
                    <div className="mt-3 pt-3 border-t border-neutral-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-primary-600" />
                        <span className="text-sm font-medium text-neutral-700">
                          AI 功效分析
                        </span>
                      </div>
                      {recipe.aiEffectsAnalysis ? (
                        <>
                          <p className="text-sm text-primary-600">
                            {recipe.aiEffectsAnalysis}
                          </p>
                          {recipe.aiAnalyzedAt && (
                            <p className="text-xs text-neutral-500 mt-1">
                              分析時間：{formatDate(recipe.aiAnalyzedAt)}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-neutral-500 italic">
                          尚未進行功效分析
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto">
                  <Button
                    onClick={handleReanalyze}
                    disabled={reanalyzing}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 flex-1 sm:flex-none"
                  >
                    {reanalyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">
                      {recipe.aiEffectsAnalysis ? '重新分析功效' : '分析功效'}
                    </span>
                    <span className="sm:hidden">分析功效</span>
                  </Button>
                  <Button
                    onClick={handleExportToMarketing}
                    variant="outline"
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0 hover:brightness-110 flex-1 sm:flex-none"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:inline">導出到行銷助手</span>
                    <span className="sm:hidden">導出行銷</span>
                  </Button>
                  <Button
                    onClick={handleCreateOrder}
                    className="flex items-center gap-2 flex-1 sm:flex-none"
                  >
                    <PlusCircle className="h-4 w-4" />
                    創建新訂單
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="liquid-glass-card">
              <div className="liquid-glass-content">
                <div className="flex items-center gap-3">
                  <IconContainer 
                    icon={Package} 
                    variant="success" 
                    size="md"
                  />
                  <div>
                    <p className="text-xs text-neutral-600">生產次數</p>
                    <p className="text-xl font-bold text-neutral-800">{recipe.productionCount}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="liquid-glass-card">
              <div className="liquid-glass-content">
                <div className="flex items-center gap-3">
                  <IconContainer 
                    icon={Calendar} 
                    variant="info" 
                    size="md"
                  />
                  <div>
                    <p className="text-xs text-neutral-600">最後生產</p>
                    <p className="text-sm font-semibold text-neutral-800">
                      {formatDate(recipe.lastProductionAt)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="liquid-glass-card">
              <div className="liquid-glass-content">
                <div className="flex items-center gap-3">
                  <IconContainer 
                    icon={Calendar} 
                    variant="warning" 
                    size="md"
                  />
                  <div>
                    <p className="text-xs text-neutral-600">最後使用</p>
                    <p className="text-sm font-semibold text-neutral-800">
                      {formatDate(recipe.lastUsedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Recipe Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Ingredients */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="liquid-glass-card liquid-glass-card-elevated">
                <div className="liquid-glass-content">
                  <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                    <Beaker className="h-5 w-5 text-info-600" />
                    原料清單 ({recipe.ingredients.length} 項)
                  </h2>
                  <div className="space-y-2">
                    {/* Desktop Table Header */}
                    <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-neutral-600 pb-2 border-b border-neutral-200">
                      <div className="col-span-6">原料名稱</div>
                      <div className="col-span-3 text-right">單粒含量</div>
                      <div className="col-span-3 text-center">標記</div>
                    </div>
                    {recipe.ingredients.map((ingredient, index) => (
                      <div key={index} className="border-b border-neutral-100 hover:bg-gray-50/50 rounded transition-colors">
                        {/* Desktop Layout */}
                        <div className="hidden sm:grid grid-cols-12 gap-2 items-center py-2">
                          <div className="col-span-6 text-sm text-neutral-800 font-medium">
                            {ingredient.materialName}
                          </div>
                          <div className="col-span-3 text-right text-sm text-neutral-700">
                            {ingredient.unitContentMg} mg
                          </div>
                          <div className="col-span-3 flex justify-center gap-1">
                            {ingredient.isCustomerProvided && (
                              <Badge variant="outline" className="text-xs">
                                客戶指定
                              </Badge>
                            )}
                            {ingredient.isCustomerSupplied && (
                              <Badge variant="outline" className="text-xs bg-success-50 text-success-700 border-emerald-200">
                                客戶提供
                              </Badge>
                            )}
                          </div>
                        </div>
                        {/* Mobile Layout */}
                        <div className="sm:hidden p-3 space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="text-sm text-neutral-800 font-medium flex-1 pr-2">
                              {ingredient.materialName}
                            </div>
                            <div className="text-sm text-neutral-700 font-semibold">
                              {ingredient.unitContentMg} mg
                            </div>
                          </div>
                          {(ingredient.isCustomerProvided || ingredient.isCustomerSupplied) && (
                            <div className="flex gap-1">
                              {ingredient.isCustomerProvided && (
                                <Badge variant="outline" className="text-xs">
                                  客戶指定
                                </Badge>
                              )}
                              {ingredient.isCustomerSupplied && (
                                <Badge variant="outline" className="text-xs bg-success-50 text-success-700 border-emerald-200">
                                  客戶提供
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-neutral-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-neutral-600">單粒總重量</span>
                      <span className="text-lg font-bold text-neutral-800">{recipe.unitWeightMg} mg</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">
              {/* Capsule Specs */}
              <Card className="liquid-glass-card liquid-glass-card-elevated">
                <div className="liquid-glass-content">
                  <h2 className="text-lg font-semibold text-neutral-800 mb-4">膠囊規格</h2>
                  <div className="space-y-3">
                    {recipe.capsuleSize && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-600">大小</span>
                        <Badge variant="outline">{recipe.capsuleSize}</Badge>
                      </div>
                    )}
                    {recipe.capsuleColor && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-600">顏色</span>
                        <Badge variant="outline">{recipe.capsuleColor}</Badge>
                      </div>
                    )}
                    {recipe.capsuleType && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-600">類型</span>
                        <Badge variant="outline">{recipe.capsuleType}</Badge>
                      </div>
                    )}
                    {!recipe.capsuleSize && !recipe.capsuleColor && !recipe.capsuleType && (
                      <p className="text-sm text-neutral-500">未指定膠囊規格</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Category & Tags */}
              {(recipe.category || (recipe.tags && recipe.tags.length > 0)) && (
                <Card className="liquid-glass-card liquid-glass-card-elevated">
                  <div className="liquid-glass-content">
                    <h2 className="text-lg font-semibold text-neutral-800 mb-4">分類與標籤</h2>
                    <div className="space-y-3">
                      {recipe.category && (
                        <div>
                          <span className="text-xs text-neutral-600 block mb-2">分類</span>
                          <Badge>{recipe.category}</Badge>
                        </div>
                      )}
                      {recipe.tags && recipe.tags.length > 0 && (
                        <div>
                          <span className="text-xs text-neutral-600 block mb-2">標籤</span>
                          <div className="flex flex-wrap gap-2">
                            {recipe.tags.map((tag, index) => (
                              <Badge key={index} variant="outline">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Production Notes & Edit History */}
              {recipe.notes && (
                <Card className="liquid-glass-card liquid-glass-card-elevated">
                  <div className="liquid-glass-content">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-neutral-800">生產備註與編輯歷史</h2>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEditNotes}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        編輯
                      </Button>
                    </div>
                    {/* 🆕 优化显示：分段显示备注和编辑历史 */}
                    <div className="text-sm max-h-60 overflow-y-auto space-y-3">
                      {recipe.notes.split('\n\n---\n').map((entry, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'whitespace-pre-wrap',
                            entry.startsWith('[编辑记录]')
                              ? 'text-primary-600 text-xs border-l-2 border-primary-300 pl-3 py-1 bg-primary-50 rounded-r'
                              : 'text-neutral-600'
                          )}
                        >
                          {entry}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* Source Orders */}
              <Card className="liquid-glass-card liquid-glass-card-elevated">
                <div className="liquid-glass-content">
                  <h2 className="text-lg font-semibold text-neutral-800 mb-4">
                    來源訂單 ({recipe.sourceOrderIds.length})
                  </h2>
                  <div className="space-y-2">
                    {recipe.sourceOrderIds.map((orderId, index) => (
                      <Link key={orderId} href={`/orders/${orderId}`}>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-200 hover:border-violet-300 hover:bg-info-50/30 transition-all cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-neutral-400 group-hover:text-info-600" />
                            <span className="text-sm text-neutral-700 group-hover:text-info-700 font-medium">
                              訂單 #{index + 1}
                            </span>
                          </div>
                          <ExternalLink className="h-4 w-4 text-neutral-400 group-hover:text-info-600" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </Card>

            </div>
          </div>
        </div>
      </main>

      <LiquidGlassFooter />

      {/* Edit Notes Dialog */}
      <Dialog open={editNotesOpen} onOpenChange={setEditNotesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯生產備註</DialogTitle>
            <DialogDescription>
              更新配方的製程問題記錄和品管備註
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editingNotes}
              onChange={(e) => setEditingNotes(e.target.value)}
              placeholder="輸入生產備註、製程問題或品管注意事項..."
              rows={10}
              className="resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditNotesOpen(false)}
                disabled={savingNotes}
              >
                取消
              </Button>
              <Button
                onClick={handleSaveNotes}
                disabled={savingNotes}
              >
                {savingNotes && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除配方</DialogTitle>
            <DialogDescription>
              此操作將刪除配方「{recipe?.recipeName}」。刪除後配方將不再顯示，但不會影響已創建的訂單。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              確認刪除
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🆕 Edit Recipe Dialog */}
      {recipe && (
        <EditRecipeDialog
          recipe={recipe}
          open={editRecipeOpen}
          onOpenChange={setEditRecipeOpen}
          onSuccess={fetchRecipe}
        />
      )}
    </div>
  )
}

