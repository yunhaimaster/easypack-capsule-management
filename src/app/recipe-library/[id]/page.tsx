'use client'

import { useState, useEffect, useCallback, use } from 'react'
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
  Trash2,
  FlaskConical,
  Download,
  FileSpreadsheet,
  FileText
} from 'lucide-react'
import { IconContainer } from '@/components/ui/icon-container'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/toast-provider'
import type { RecipeLibraryItem } from '@/types'
import { EditRecipeDialog } from '@/components/recipe-library/edit-recipe-dialog'
import { IngredientWarnings } from '@/components/recipe-library/ingredient-warnings'
import { AIInsightsPanel } from '@/components/recipe-library/ai-insights-panel'
import { cn } from '@/lib/utils'

export default function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { showToast } = useToast()
  const { id } = use(params)
  const [recipe, setRecipe] = useState<RecipeLibraryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [reanalyzing, setReanalyzing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [syncingNotes, setSyncingNotes] = useState(false)
  const [editRecipeOpen, setEditRecipeOpen] = useState(false) // 🆕 編輯配方對話框狀態

  const fetchRecipe = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/recipes/${id}`)
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
  }, [id, showToast, router])

  useEffect(() => {
    fetchRecipe()
  }, [fetchRecipe])

  const handleCreateOrder = async () => {
    try {
      if (!recipe) return
      
      // 先調用 use API 更新使用統計
      await fetch(`/api/recipes/${id}/use`)
      
      // 🆕 根據配方類型選擇不同的跳轉方式
      if (recipe.recipeType === 'template') {
        // 模板配方：使用 fromTemplate 參數
        router.push(`/orders/new?fromTemplate=${id}`)
      } else {
        // 生產配方：使用 recipeId 參數
        router.push(`/orders/new?recipeId=${id}`)
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

  const handleExportToMarketing = () => {
    if (!recipe) return
    
    const ingredientsData = recipe.ingredients.map(ing => ({
      materialName: ing.materialName,
      unitContentMg: ing.unitContentMg
    }))
    
    localStorage.setItem('marketing_imported_ingredients', JSON.stringify(ingredientsData))
    router.push('/marketing-assistant')
  }

  const handleGranulationAnalysis = () => {
    if (!recipe) return
    try {
      const { exportRecipeToGranulation } = require('@/lib/granulation-export')
      exportRecipeToGranulation(recipe.ingredients)
    } catch (error) {
      showToast({
        title: '導出失敗',
        description: '無法導出至製粒分析',
        variant: 'destructive'
      })
    }
  }

  const handleExportToExcel = () => {
    if (!recipe) return
    
    // Generate CSV with BOM for Excel compatibility
    const BOM = '\uFEFF'
    const headers = ['配方名稱', '客戶', '產品', '原料名稱', '含量 (mg)', 'AI 功效分析']
    
    const rows = recipe.ingredients.map(ing => [
      recipe.recipeName,
      recipe.customerName,
      recipe.productName,
      ing.materialName,
      ing.unitContentMg.toString(),
      recipe.aiEffectsAnalysis || ''
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `配方_${recipe.recipeName}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    showToast({
      title: '導出成功',
      description: '配方已導出為 Excel 格式',
      variant: 'default'
    })
  }

  const handleExportToPDF = async () => {
    if (!recipe) return
    
    try {
      // Dynamic import for client-side only
      const jsPDF = (await import('jspdf')).default
      const html2canvas = (await import('html2canvas')).default
      
      const doc = new jsPDF()
      
      // Create a temporary container for rendering Chinese text
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.padding = '30px'
      tempDiv.style.backgroundColor = 'white'
      tempDiv.style.width = '700px'
      tempDiv.style.fontFamily = "'Microsoft YaHei', 'PingFang SC', 'SimHei', sans-serif"
      
      const ingredients = typeof recipe.ingredients === 'string' 
        ? JSON.parse(recipe.ingredients)
        : recipe.ingredients
      
      tempDiv.innerHTML = `
        <div style="margin-bottom: 30px;">
          <div style="font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 20px; border-bottom: 3px solid #2563eb; padding-bottom: 10px;">
            ${recipe.recipeName}
          </div>
          <div style="font-size: 16px; line-height: 2; color: #374151;">
            <div><strong style="color: #1f2937;">客戶：</strong>${recipe.customerName}</div>
            <div><strong style="color: #1f2937;">產品：</strong>${recipe.productName}</div>
            <div><strong style="color: #1f2937;">配方類型：</strong>${recipe.recipeType === 'production' ? '生產配方' : '模板配方'}</div>
            <div><strong style="color: #1f2937;">單粒總重量：</strong>${recipe.unitWeightMg} mg</div>
          </div>
        </div>
        
        <div>
          <div style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1f2937;">原料清單</div>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #2563eb; color: #ffffff;">
                <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left; color: #ffffff;">原料名稱</th>
                <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left; color: #ffffff;">單粒含量 (mg)</th>
              </tr>
            </thead>
            <tbody>
              ${ingredients.map((ing: any) => `
                <tr style="background-color: #ffffff;">
                  <td style="border: 1px solid #d1d5db; padding: 10px; color: #1f2937;">${ing.materialName}</td>
                  <td style="border: 1px solid #d1d5db; padding: 10px; color: #1f2937;">${ing.unitContentMg}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        ${recipe.aiEffectsAnalysis ? `
          <div style="margin-top: 30px;">
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1f2937;">AI 功效分析</div>
            <div style="font-size: 14px; line-height: 1.8; color: #374151; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
              ${recipe.aiEffectsAnalysis}
            </div>
          </div>
        ` : ''}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #d1d5db; font-size: 12px; color: #6b7280;">
          生成時間：${new Date().toLocaleString('zh-HK')}
        </div>
      `
      document.body.appendChild(tempDiv)
      
      // Render the entire content as image
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      })
      
      document.body.removeChild(tempDiv)
      
      // Calculate dimensions to fit in PDF
      const imgWidth = 180 // PDF width minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      // Add image to PDF (split into multiple pages if needed)
      const pageHeight = 280 // PDF page height minus margins
      let heightLeft = imgHeight
      let position = 10
      
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 15, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10
        doc.addPage()
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 15, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      // Save the PDF
      doc.save(`Recipe_${recipe.recipeName}_${new Date().toISOString().split('T')[0]}.pdf`)
      
      // Log audit
      await fetch('/api/recipes/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ recipeId: recipe.id })
      })
      
      showToast({
        title: 'Export Successful',
        description: 'Recipe exported as PDF with Chinese support',
        variant: 'default'
      })
    } catch (error) {
      console.error('PDF export error:', error)
      showToast({
        title: 'Export Failed',
        description: 'Unable to generate PDF file',
        variant: 'destructive'
      })
    }
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
            <p className="text-neutral-600 dark:text-white/75">載入配方中...</p>
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
            <div className="flex flex-wrap items-center gap-2">
              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">導出</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportToExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    導出為 Excel/CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportToPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    導出為 PDF
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExportToMarketing}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    導出到行銷助手
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleGranulationAnalysis}>
                    <FlaskConical className="h-4 w-4 mr-2" />
                    導出到製粒分析
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Delete Button */}
              <Button 
                variant="destructive" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">刪除</span>
              </Button>
            </div>
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
                      <h1 className="text-xl sm:text-2xl font-bold text-neutral-800 dark:text-white/95">
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
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-neutral-600 dark:text-white/75">
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
                      <p className="mt-3 text-sm text-neutral-600 dark:text-white/75">{recipe.description}</p>
                    )}
                    <div className="mt-3 pt-3 border-t border-neutral-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-primary-600" />
                        <span className="text-sm font-medium text-neutral-700 dark:text-white/85">
                          AI 功效分析
                        </span>
                      </div>
                      {recipe.aiEffectsAnalysis ? (
                        <>
                          <p className="text-sm text-primary-600">
                            {recipe.aiEffectsAnalysis}
                          </p>
                          {recipe.aiAnalyzedAt && (
                            <p className="text-xs text-neutral-500 dark:text-white/65 mt-1">
                              分析時間：{formatDate(recipe.aiAnalyzedAt)}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-neutral-500 dark:text-white/65 italic">
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
                    <p className="text-xs text-neutral-600 dark:text-white/75">生產次數</p>
                    <p className="text-xl font-bold text-neutral-800 dark:text-white/95">{recipe.productionCount}</p>
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
                    <p className="text-xs text-neutral-600 dark:text-white/75">最後生產</p>
                    <p className="text-sm font-semibold text-neutral-800 dark:text-white/95">
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
                    <p className="text-xs text-neutral-600 dark:text-white/75">最後使用</p>
                    <p className="text-sm font-semibold text-neutral-800 dark:text-white/95">
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
            <div className="lg:col-span-2">
              <Card className="liquid-glass-card liquid-glass-card-elevated">
                <div className="liquid-glass-content">
                  <h2 className="text-lg font-semibold text-neutral-800 dark:text-white/95 mb-4 flex items-center gap-2">
                    <Beaker className="h-5 w-5 text-info-600" />
                    原料清單 ({recipe.ingredients.length} 項)
                  </h2>
                  <div className="space-y-2">
                    {/* Desktop Table Header */}
                    <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-neutral-600 dark:text-white/75 pb-2 border-b border-neutral-200">
                      <div className="col-span-6">原料名稱</div>
                      <div className="col-span-3 text-right">單粒含量</div>
                      <div className="col-span-3 text-center">標記</div>
                    </div>
                    {recipe.ingredients.map((ingredient, index) => (
                      <div key={index} className="border-b border-neutral-100 hover:bg-neutral-50/50 rounded transition-colors">
                        {/* Desktop Layout */}
                        <div className="hidden sm:grid grid-cols-12 gap-2 items-center py-2">
                          <div className="col-span-6 text-sm text-neutral-800 dark:text-white/95 font-medium">
                            {ingredient.materialName}
                          </div>
                          <div className="col-span-3 text-right text-sm text-neutral-700 dark:text-white/85">
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
                            <div className="text-sm text-neutral-800 dark:text-white/95 font-medium flex-1 pr-2">
                              {ingredient.materialName}
                            </div>
                            <div className="text-sm text-neutral-700 dark:text-white/85 font-semibold">
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
                      <span className="text-sm font-medium text-neutral-600 dark:text-white/75">單粒總重量</span>
                      <span className="text-lg font-bold text-neutral-800 dark:text-white/95">{recipe.unitWeightMg} mg</span>
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
                  <h2 className="text-lg font-semibold text-neutral-800 dark:text-white/95 mb-4">膠囊規格</h2>
                  <div className="space-y-3">
                    {recipe.capsuleSize && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-600 dark:text-white/75">大小</span>
                        <Badge variant="outline">{recipe.capsuleSize}</Badge>
                      </div>
                    )}
                    {recipe.capsuleColor && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-600 dark:text-white/75">顏色</span>
                        <Badge variant="outline">{recipe.capsuleColor}</Badge>
                      </div>
                    )}
                    {recipe.capsuleType && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-600 dark:text-white/75">類型</span>
                        <Badge variant="outline">{recipe.capsuleType}</Badge>
                      </div>
                    )}
                    {!recipe.capsuleSize && !recipe.capsuleColor && !recipe.capsuleType && (
                      <p className="text-sm text-neutral-500 dark:text-white/65">未指定膠囊規格</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Category & Tags */}
              {(recipe.category || (recipe.tags && recipe.tags.length > 0)) && (
                <Card className="liquid-glass-card liquid-glass-card-elevated">
                  <div className="liquid-glass-content">
                    <h2 className="text-lg font-semibold text-neutral-800 dark:text-white/95 mb-4">分類與標籤</h2>
                    <div className="space-y-3">
                      {recipe.category && (
                        <div>
                          <span className="text-xs text-neutral-600 dark:text-white/75 block mb-2">分類</span>
                          <Badge>{recipe.category}</Badge>
                        </div>
                      )}
                      {recipe.tags && recipe.tags.length > 0 && (
                        <div>
                          <span className="text-xs text-neutral-600 dark:text-white/75 block mb-2">標籤</span>
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

              {/* Source Orders */}
              <Card className="liquid-glass-card liquid-glass-card-elevated">
                <div className="liquid-glass-content">
                  <h2 className="text-lg font-semibold text-neutral-800 dark:text-white/95 mb-4">
                    來源訂單 ({recipe.sourceOrderIds.length})
                  </h2>
                  <div className="space-y-2">
                    {recipe.sourceOrderIds.map((orderId, index) => (
                      <Link key={orderId} href={`/orders/${orderId}`}>
                        <div className="flex items-center justify-between p-3 bg-surface-primary rounded-lg border border-neutral-200 hover:border-info-300 hover:bg-info-50/30 transition-all cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-neutral-400 dark:text-white/55 group-hover:text-info-600" />
                            <span className="text-sm text-neutral-700 dark:text-white/85 group-hover:text-info-700 font-medium">
                              訂單 #{index + 1}
                            </span>
                          </div>
                          <ExternalLink className="h-4 w-4 text-neutral-400 dark:text-white/55 group-hover:text-info-600" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* AI Analysis Tools - Full Width Section */}
          <div className="space-y-6 mt-6">
            {/* AI Ingredient Interactions */}
            <IngredientWarnings recipe={recipe} />

            {/* AI Optimization Suggestions */}
            <AIInsightsPanel recipe={recipe} />
          </div>
        </div>
      </main>

      <LiquidGlassFooter />

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

