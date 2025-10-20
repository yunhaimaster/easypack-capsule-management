'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { LiquidGlassFooter } from '@/components/ui/liquid-glass-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IconContainer } from '@/components/ui/icon-container'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Beaker,
  Search,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  Package,
  Eye,
  Brain,
  Sparkles,
  List,
  LayoutGrid
} from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'
import { SmartTemplateImport } from '@/components/forms/smart-template-import'
import { RecipeListItem } from '@/components/recipe-library/recipe-list-item'
import { BatchAnalysisModal } from '@/components/recipe-library/batch-analysis-modal'
import { AdvancedFilters } from '@/components/recipe-library/advanced-filters'
import { RecipeActionsMenu } from '@/components/recipe-library/recipe-actions-menu'
import { EFFECT_CATEGORIES, getRecipeCategories } from '@/lib/parse-effects'
import type { RecipeLibraryItem, BatchImportResult } from '@/types'
import { useRecipeReview } from '@/hooks/use-recipe-review'

export default function RecipeLibraryPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { openReview, drawer } = useRecipeReview()

  // Tab state
  const [activeTab, setActiveTab] = useState<'production' | 'template'>('template')
  
  // View mode state (list or card)
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list')

  // State
  const [recipes, setRecipes] = useState<RecipeLibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [productionCount, setProductionCount] = useState(0)
  const [templateCount, setTemplateCount] = useState(0)

  // Batch import state (for production recipes)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<BatchImportResult | null>(null)
  const [importStats, setImportStats] = useState<{
    completedOrdersCount: number
    recipesCount: number
    totalProductionCount: number
    estimatedNewRecipes: number
  } | null>(null)

  // Template import state
  const [importingTemplates, setImportingTemplates] = useState(false)

  // Individual analysis state
  const [analyzingRecipeId, setAnalyzingRecipeId] = useState<string | null>(null)
  const [failedRecipes, setFailedRecipes] = useState<Set<string>>(new Set())
  
  // Batch analysis state
  const [showBatchAnalysisModal, setShowBatchAnalysisModal] = useState(false)
  const [unanalyzedRecipes, setUnanalyzedRecipes] = useState<RecipeLibraryItem[]>([])
  
  // Effect filter state
  const [effectFilter, setEffectFilter] = useState<string>('all')
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({ all: 0 })
  
  // Advanced filters state
  const [selectedEffects, setSelectedEffects] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'usage' | 'ingredients'>('newest')
  const [ingredientFilter, setIngredientFilter] = useState<string>('')
  const [quickFilter, setQuickFilter] = useState<string | null>(null)

  // Fetch recipes
  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true)
      // 🆕 優化：始終分頁，服務器端處理功效篩選和原料搜索
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12', // 始終分頁
        keyword: searchKeyword,
        recipeType: activeTab, // 🆕 根據標籤頁篩選
        effectCategories: selectedEffects.join(','), // 🆕 傳給後端
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
      
      // 添加原料篩選（如果有）
      if (ingredientFilter) {
        params.set('ingredientName', ingredientFilter)
      }

      const response = await fetch(`/api/recipes?${params}`)
      const result = await response.json()

      if (result.success) {
        setRecipes(result.data.recipes)
        setTotal(result.data.pagination.total)
        setTotalPages(result.data.pagination.totalPages)
        setCategoryCounts(result.data.categoryCounts || { all: 0 }) // 🆕 設置類別統計
      } else {
        showToast({
          title: '載入失敗',
          description: result.error || '無法載入配方列表',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Fetch recipes error:', error)
      showToast({
        title: '載入失敗',
        description: '無法連接到服務器',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [page, searchKeyword, activeTab, selectedEffects, ingredientFilter, showToast])

  // Fetch counts for both types
  const fetchCounts = useCallback(async () => {
    try {
      // Production count
      const prodResponse = await fetch('/api/recipes?recipeType=production&limit=1')
      const prodResult = await prodResponse.json()
      if (prodResult.success) {
        setProductionCount(prodResult.data.pagination.total)
      }

      // Template count
      const tempResponse = await fetch('/api/recipes?recipeType=template&limit=1')
      const tempResult = await tempResponse.json()
      if (tempResult.success) {
        setTemplateCount(tempResult.data.pagination.total)
      }
    } catch (error) {
      console.error('Fetch counts error:', error)
    }
  }, [])

  // Fetch import stats (for production recipes)
  const fetchImportStats = async () => {
    try {
      const response = await fetch('/api/recipes/batch-import')
      const result = await response.json()
      if (result.success) {
        setImportStats(result.data)
      }
    } catch (error) {
      console.error('Fetch stats error:', error)
    }
  }

  // Batch import production recipes from orders
  const handleBatchImport = async () => {
    try {
      setImporting(true)
      setImportResult(null)

      const response = await fetch('/api/recipes/batch-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const result = await response.json()

      if (result.success) {
        setImportResult(result.data)
        showToast({
          title: '導入完成',
          description: result.message,
          variant: 'default'
        })
        fetchRecipes()
        fetchCounts()
        fetchImportStats()
      } else {
        showToast({
          title: '導入失敗',
          description: result.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Batch import error:', error)
      showToast({
        title: '導入失敗',
        description: '無法連接到服務器',
        variant: 'destructive'
      })
    } finally {
      setImporting(false)
    }
  }

  // Batch import templates
  const handleBatchImportTemplates = async (parsedRecipes: any[]) => {
    // Open review dialog instead of directly importing
    openReview(parsedRecipes, async (selectedRecipes) => {
      try {
        setImportingTemplates(true)

        const response = await fetch('/api/recipes/batch-import-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipes: selectedRecipes })
        })

        const result = await response.json()

        if (result.success) {
          showToast({
            title: '導入完成',
            description: result.message,
            variant: 'default'
          })
          fetchRecipes()
          fetchCounts()
        } else {
          showToast({
            title: '導入失敗',
            description: result.error,
            variant: 'destructive'
          })
        }
      } catch (error) {
        console.error('Batch import templates error:', error)
        showToast({
          title: '導入失敗',
          description: '無法連接到服務器',
          variant: 'destructive'
        })
      } finally {
        setImportingTemplates(false)
      }
    })
  }

  // Individual recipe analysis
  const handleAnalyzeEffects = async (recipeId: string) => {
    try {
      setAnalyzingRecipeId(recipeId)
      // Remove from failed list when retrying
      setFailedRecipes(prev => {
        const newSet = new Set(prev)
        newSet.delete(recipeId)
        return newSet
      })
      
      showToast({
        title: '開始分析',
        description: '正在分析配方功效...',
        variant: 'default'
      })

      const response = await fetch(`/api/recipes/${recipeId}/analyze-effects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()

      if (result.success) {
        showToast({
          title: '分析完成',
          description: '配方功效已成功分析',
          variant: 'default'
        })
        fetchRecipes()  // Refresh list to show new effects
      } else {
        // Mark as failed
        setFailedRecipes(prev => new Set(prev).add(recipeId))
        showToast({
          title: '分析失敗',
          description: result.error || '無法分析配方功效',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Analyze effects error:', error)
      // Mark as failed
      setFailedRecipes(prev => new Set(prev).add(recipeId))
      showToast({
        title: '分析失敗',
        description: '無法連接到服務器',
        variant: 'destructive'
      })
    } finally {
      setAnalyzingRecipeId(null)
    }
  }

  // Initial load
  useEffect(() => {
    fetchRecipes()
    fetchCounts()
  }, [fetchRecipes, fetchCounts])

  // Load import stats when opening dialog
  useEffect(() => {
    if (showImportDialog && !importStats) {
      fetchImportStats()
    }
  }, [showImportDialog, importStats])

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchRecipes()
    }, 500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKeyword])

  // Reset page when changing tabs
  useEffect(() => {
    setPage(1)
    setSearchKeyword('')
    setEffectFilter('all')
  }, [activeTab])

  // Marketing analysis handler
  const handleMarketingAnalysis = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId)
    if (!recipe) return
    
    const ingredientsData = recipe.ingredients.map(ing => ({
      materialName: ing.materialName,
      unitContentMg: ing.unitContentMg
    }))
    
    localStorage.setItem('marketing_imported_ingredients', JSON.stringify(ingredientsData))
    router.push('/marketing-assistant')
  }

  // 🆕 製粒分析處理
  const handleGranulationAnalysis = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId)
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

  // Effect filter click handler
  const handleEffectFilterClick = (category: string) => {
    setEffectFilter(category)
    showToast({
      title: '已套用篩選',
      description: `正在顯示「${category}」類別的配方`,
      variant: 'default'
    })
  }

  // Advanced filter handlers
  const handleEffectToggle = (effect: string) => {
    setSelectedEffects(prev => 
      prev.includes(effect) 
        ? prev.filter(e => e !== effect)
        : [...prev, effect]
    )
  }

  const handleClearAllFilters = () => {
    setSelectedEffects([])
    setEffectFilter('all')
    setSortBy('newest')
    setIngredientFilter('')
    setQuickFilter(null)
    showToast({
      title: '已清除篩選',
      description: '所有篩選條件已重置',
      variant: 'default'
    })
  }

  const handleQuickFilter = (filter: string) => {
    if (quickFilter === filter) {
      setQuickFilter(null) // Toggle off
      return
    }
    
    setQuickFilter(filter)
    
    // Apply quick filter logic
    switch (filter) {
      case 'recent':
        setSortBy('newest')
        break
      case 'popular':
        setSortBy('usage')
        break
      case 'vitaminC':
        setIngredientFilter('維生素C')
        break
      case 'calcium':
        setIngredientFilter('鈣')
        break
      case 'collagen':
        setIngredientFilter('膠原蛋白')
        break
    }
  }

  // Batch analysis handlers
  const handleOpenBatchAnalysis = () => {
    const unanalyzed = recipes.filter(r => !r.aiEffectsAnalysis)
    setUnanalyzedRecipes(unanalyzed)
    setShowBatchAnalysisModal(true)
  }

  const handleBatchAnalysisComplete = () => {
    fetchRecipes() // Refresh the list
    showToast({
      title: '批量分析完成',
      description: '配方列表已更新',
      variant: 'default'
    })
  }

  // Recipe action handlers
  const handleExportRecipe = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId)
    if (!recipe) return

    // Create CSV content
    let csvContent = '\uFEFF' // UTF-8 BOM for Excel
    
    // Header info
    csvContent += '配方資訊\n'
    csvContent += `配方名稱,${recipe.recipeName}\n`
    csvContent += `產品名稱,${recipe.productName || ''}\n`
    csvContent += `客戶名稱,${recipe.customerName || ''}\n`
    csvContent += `配方類型,${recipe.recipeType === 'template' ? '模板配方' : '生產配方'}\n`
    csvContent += `使用次數,${recipe.productionCount || 0}\n`
    csvContent += `創建日期,${new Date(recipe.createdAt || '').toLocaleDateString('zh-TW')}\n`
    csvContent += `導出日期,${new Date().toLocaleDateString('zh-TW')}\n`
    csvContent += '\n'
    
    // Ingredients table
    csvContent += '原料清單\n'
    csvContent += '序號,原料名稱,單位含量(mg)\n'
    recipe.ingredients.forEach((ing, idx) => {
      csvContent += `${idx + 1},"${ing.materialName}",${ing.unitContentMg}\n`
    })
    csvContent += '\n'
    
    // AI Analysis
    if (recipe.aiEffectsAnalysis) {
      csvContent += 'AI 功效分析\n'
      csvContent += `"${recipe.aiEffectsAnalysis.replace(/"/g, '""')}"\n`
      csvContent += '\n'
    }
    
    // Notes
    if (recipe.notes) {
      csvContent += '備註\n'
      csvContent += `"${recipe.notes.replace(/"/g, '""')}"\n`
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${recipe.recipeName}_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showToast({
      title: '導出成功',
      description: '配方已導出為 Excel 檔案',
      variant: 'default'
    })
  }

  const handleDeleteRecipe = async (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId)
    if (!recipe) return

    // eslint-disable-next-line no-alert
    if (!window.confirm(`確定要刪除配方「${recipe.recipeName}」嗎？此操作無法撤銷。`)) {
      return
    }

    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        showToast({
          title: '刪除成功',
          description: '配方已成功刪除',
          variant: 'default'
        })
        fetchRecipes()
      } else {
        showToast({
          title: '刪除失敗',
          description: result.error || '無法刪除配方',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Delete recipe error:', error)
      showToast({
        title: '刪除失敗',
        description: '無法連接到伺服器',
        variant: 'destructive'
      })
    }
  }


  // Filter and sort recipes
  const filteredRecipes = useMemo(() => {
    let filtered = [...recipes]
    
    // Apply effect filter (legacy single filter)
    if (effectFilter !== 'all') {
      filtered = filtered.filter(recipe => {
        const categories = getRecipeCategories(recipe.aiEffectsAnalysis)
        return categories.includes(effectFilter)
      })
    }
    
    // Apply multi-select effect filters
    if (selectedEffects.length > 0) {
      filtered = filtered.filter(recipe => {
        const categories = getRecipeCategories(recipe.aiEffectsAnalysis)
        // AND logic: recipe must have all selected effects
        return selectedEffects.every(effect => categories.includes(effect))
      })
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        case 'name':
          return a.recipeName.localeCompare(b.recipeName, 'zh-TW')
        case 'usage':
          return (b.productionCount || 0) - (a.productionCount || 0)
        case 'ingredients':
          return (b.ingredients?.length || 0) - (a.ingredients?.length || 0)
        default:
          return 0
      }
    })
    
    return filtered
  }, [recipes, effectFilter, selectedEffects, sortBy])

  // Note: categoryCounts is now fetched from API instead of calculated here

  return (
    <div className="min-h-screen logo-bg-animation flex flex-col">
      <LiquidGlassNav />

      <main className="flex-1">
        <div className="pt-28 sm:pt-24 px-4 sm:px-6 md:px-8 space-y-8 pb-8">
          {/* Page Header */}
          <div className="text-center mb-6 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-info-500/15 border border-violet-300/40 text-xs font-medium text-info-700">
              <span className="h-2 w-2 rounded-full bg-info-500" />
              配方管理工具
            </div>
            <h1 className="text-xl md:text-2xl font-semibold text-neutral-800">
              配方庫
            </h1>
            <p className="text-sm text-neutral-600 max-w-2xl mx-auto">
              管理生產配方和模板配方，快速創建新訂單
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="liquid-glass-card">
              <div className="liquid-glass-content p-6">
                <div className="flex items-center gap-3">
                  <IconContainer icon={Beaker} variant="info" size="md" />
                  <div>
                    <p className="text-sm text-neutral-600">配方總數</p>
                    <p className="text-2xl font-bold text-neutral-800">{productionCount + templateCount}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="liquid-glass-card">
              <div className="liquid-glass-content p-6">
                <div className="flex items-center gap-3">
                  <IconContainer icon={Package} variant="success" size="md" />
                  <div>
                    <p className="text-sm text-neutral-600">生產配方</p>
                    <p className="text-2xl font-bold text-neutral-800">{productionCount}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="liquid-glass-card">
              <div className="liquid-glass-content p-6">
                <div className="flex items-center gap-3">
                  <IconContainer icon={Sparkles} variant="primary" size="md" />
                  <div>
                    <p className="text-sm text-neutral-600">模板配方</p>
                    <p className="text-2xl font-bold text-neutral-800">{templateCount}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'production' | 'template')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="production" className="flex items-center justify-center gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">生產配方</span>
                <span className="sm:hidden">生產</span>
                <Badge variant="secondary" className="ml-2">{productionCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="template" className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">模板配方</span>
                <span className="sm:hidden">模板</span>
                <Badge variant="secondary" className="ml-2">{templateCount}</Badge>
              </TabsTrigger>
            </TabsList>

            {/* Production Tab */}
            <TabsContent value="production" className="space-y-6">
              {/* Search & Actions */}
              <Card className="liquid-glass-card liquid-glass-card-elevated">
                <div className="liquid-glass-content">
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                        <Input
                          type="text"
                          placeholder="搜尋配方名稱、客戶或產品..."
                          value={searchKeyword}
                          onChange={(e) => setSearchKeyword(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {/* View Mode Toggle */}
                      <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
                        <Button
                          size="sm"
                          variant={viewMode === 'list' ? 'default' : 'ghost'}
                          onClick={() => setViewMode('list')}
                          className="h-8 w-8 p-0"
                          title="列表視圖"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={viewMode === 'card' ? 'default' : 'ghost'}
                          onClick={() => setViewMode('card')}
                          className="h-8 w-8 p-0"
                          title="卡片視圖"
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Quick Filters */}
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        variant={quickFilter === 'recent' ? 'default' : 'outline'}
                        className="cursor-pointer transition-all hover:bg-neutral-100"
                        onClick={() => handleQuickFilter('recent')}
                      >
                        🕒 最近生產
                      </Badge>
                      <Badge 
                        variant={quickFilter === 'popular' ? 'default' : 'outline'}
                        className="cursor-pointer transition-all hover:bg-neutral-100"
                        onClick={() => handleQuickFilter('popular')}
                      >
                        ⭐ 常用配方
                      </Badge>
                      <Badge 
                        variant={quickFilter === 'vitaminC' ? 'default' : 'outline'}
                        className="cursor-pointer transition-all hover:bg-neutral-100"
                        onClick={() => handleQuickFilter('vitaminC')}
                      >
                        🍊 含維生素C
                      </Badge>
                      <Badge 
                        variant={quickFilter === 'calcium' ? 'default' : 'outline'}
                        className="cursor-pointer transition-all hover:bg-neutral-100"
                        onClick={() => handleQuickFilter('calcium')}
                      >
                        🦴 含鈣配方
                      </Badge>
                      <Badge 
                        variant={quickFilter === 'collagen' ? 'default' : 'outline'}
                        className="cursor-pointer transition-all hover:bg-neutral-100"
                        onClick={() => handleQuickFilter('collagen')}
                      >
                        ✨ 含膠原蛋白
                      </Badge>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => setShowImportDialog(true)}
                        className="flex items-center gap-2 flex-1 sm:flex-none"
                      >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">批量導入配方</span>
                        <span className="sm:hidden">導入配方</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Advanced Filters */}
              <AdvancedFilters
                selectedEffects={selectedEffects}
                onEffectToggle={handleEffectToggle}
                sortBy={sortBy}
                onSortChange={setSortBy}
                ingredientFilter={ingredientFilter}
                onIngredientFilterChange={setIngredientFilter}
                onClearAll={handleClearAllFilters}
              />

              {/* Recipes Grid */}
              {loading ? (
                <Card className="liquid-glass-card">
                  <div className="liquid-glass-content">
                    <div className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-info-600 mb-4" />
                      <p className="text-neutral-600">載入配方中...</p>
                    </div>
                  </div>
                </Card>
              ) : filteredRecipes.length === 0 ? (
                <Card className="liquid-glass-card">
                  <div className="liquid-glass-content">
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
                      <p className="text-neutral-600 mb-4">
                        {searchKeyword || effectFilter !== 'all' ? '找不到符合條件的配方' : '尚無生產配方'}
                      </p>
                      {!searchKeyword && effectFilter === 'all' && (
                        <Button onClick={() => setShowImportDialog(true)}>
                          從已完成訂單導入配方
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ) : (
                <RecipeGrid 
                  recipes={filteredRecipes} 
                  router={router} 
                  viewMode={viewMode}
                  onMarketingAnalysis={handleMarketingAnalysis}
                  onGranulationAnalysis={handleGranulationAnalysis}
                  onAnalyzeEffects={handleAnalyzeEffects}
                  analyzingRecipeId={analyzingRecipeId}
                  failedRecipes={failedRecipes}
                  onEffectFilterClick={handleEffectFilterClick}
                  onExport={handleExportRecipe}
                  onDelete={handleDeleteRecipe}
                />
              )}

              {/* Pagination - 只在沒有進階篩選時顯示 */}
              {totalPages > 1 && selectedEffects.length === 0 && (
                <Pagination 
                  page={page} 
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              )}
            </TabsContent>

            {/* Template Tab */}
            <TabsContent value="template" className="space-y-6">
              {/* Search & Actions */}
              <Card className="liquid-glass-card liquid-glass-card-elevated">
                <div className="liquid-glass-content">
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                        <Input
                          type="text"
                          placeholder="搜尋模板配方..."
                          value={searchKeyword}
                          onChange={(e) => setSearchKeyword(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      {/* Batch Analysis Button */}
                      {(() => {
                        const unanalyzedCount = recipes.filter(r => !r.aiEffectsAnalysis).length
                        return unanalyzedCount > 0 ? (
                          <Button
                            size="sm"
                            onClick={handleOpenBatchAnalysis}
                            className="h-9 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shrink-0"
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">分析全部</span>
                            <span className="sm:hidden">全部</span>
                            <Badge className="ml-2 bg-white/20 text-white border-0">
                              {unanalyzedCount}
                            </Badge>
                          </Button>
                        ) : null
                      })()}
                      
                      {/* View Mode Toggle */}
                      <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
                        <Button
                          size="sm"
                          variant={viewMode === 'list' ? 'default' : 'ghost'}
                          onClick={() => setViewMode('list')}
                          className="h-8 w-8 p-0"
                          title="列表視圖"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={viewMode === 'card' ? 'default' : 'ghost'}
                          onClick={() => setViewMode('card')}
                          className="h-8 w-8 p-0"
                          title="卡片視圖"
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Quick Filters */}
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        variant={quickFilter === 'recent' ? 'default' : 'outline'}
                        className="cursor-pointer transition-all hover:bg-neutral-100"
                        onClick={() => handleQuickFilter('recent')}
                      >
                        🕒 最近生產
                      </Badge>
                      <Badge 
                        variant={quickFilter === 'popular' ? 'default' : 'outline'}
                        className="cursor-pointer transition-all hover:bg-neutral-100"
                        onClick={() => handleQuickFilter('popular')}
                      >
                        ⭐ 常用配方
                      </Badge>
                      <Badge 
                        variant={quickFilter === 'vitaminC' ? 'default' : 'outline'}
                        className="cursor-pointer transition-all hover:bg-neutral-100"
                        onClick={() => handleQuickFilter('vitaminC')}
                      >
                        🍊 含維生素C
                      </Badge>
                      <Badge 
                        variant={quickFilter === 'calcium' ? 'default' : 'outline'}
                        className="cursor-pointer transition-all hover:bg-neutral-100"
                        onClick={() => handleQuickFilter('calcium')}
                      >
                        🦴 含鈣配方
                      </Badge>
                      <Badge 
                        variant={quickFilter === 'collagen' ? 'default' : 'outline'}
                        className="cursor-pointer transition-all hover:bg-neutral-100"
                        onClick={() => handleQuickFilter('collagen')}
                      >
                        ✨ 含膠原蛋白
                      </Badge>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <SmartTemplateImport 
                        onImport={handleBatchImportTemplates}
                        disabled={importingTemplates}
                      />
                      {importingTemplates && (
                        <div className="flex items-center gap-2 text-sm text-primary-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>導入中...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Advanced Filters */}
              <AdvancedFilters
                selectedEffects={selectedEffects}
                onEffectToggle={handleEffectToggle}
                sortBy={sortBy}
                onSortChange={setSortBy}
                ingredientFilter={ingredientFilter}
                onIngredientFilterChange={setIngredientFilter}
                onClearAll={handleClearAllFilters}
              />

              {/* Recipes Grid */}
              {loading ? (
                <Card className="liquid-glass-card">
                  <div className="liquid-glass-content">
                    <div className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-info-600 mb-4" />
                      <p className="text-neutral-600">載入配方中...</p>
                    </div>
                  </div>
                </Card>
              ) : filteredRecipes.length === 0 ? (
                <Card className="liquid-glass-card">
                  <div className="liquid-glass-content">
                    <div className="text-center py-12">
                      <Sparkles className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
                      <p className="text-neutral-600 mb-4">
                        {searchKeyword || effectFilter !== 'all' ? '找不到符合條件的模板配方' : '尚無模板配方'}
                      </p>
                      {!searchKeyword && effectFilter === 'all' && (
                        <p className="text-sm text-neutral-500">
                          使用上方「智能導入模板」按鈕批量導入配方
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ) : (
                <RecipeGrid 
                  recipes={filteredRecipes} 
                  router={router} 
                  viewMode={viewMode}
                  onMarketingAnalysis={handleMarketingAnalysis}
                  onGranulationAnalysis={handleGranulationAnalysis}
                  onAnalyzeEffects={handleAnalyzeEffects}
                  analyzingRecipeId={analyzingRecipeId}
                  failedRecipes={failedRecipes}
                  onEffectFilterClick={handleEffectFilterClick}
                  onExport={handleExportRecipe}
                  onDelete={handleDeleteRecipe}
                />
              )}

              {/* Pagination - 只在沒有進階篩選時顯示 */}
              {totalPages > 1 && selectedEffects.length === 0 && (
                <Pagination 
                  page={page} 
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Batch Import Dialog (for production recipes) */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>批量導入配方</DialogTitle>
            <DialogDescription>
              系統將自動從所有已完成的訂單提取配方，並智能去重。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {importStats && !importResult && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1 text-sm">
                    <p>• 已完成訂單：{importStats.completedOrdersCount} 個</p>
                    <p>• 現有配方：{importStats.recipesCount} 個</p>
                    <p>• 總生產記錄：{importStats.totalProductionCount} 次</p>
                    <p className="font-semibold text-info-700">
                      • 預估可新增：約 {importStats.estimatedNewRecipes} 個配方
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {importResult && (
              <Alert variant={importResult.errors > 0 ? 'destructive' : 'default'}>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold mb-2">導入完成！</p>
                    <p>• 新增：{importResult.imported} 個配方</p>
                    <p>• 更新：{importResult.updated} 個配方</p>
                    <p>• 跳過：{importResult.skipped} 個訂單</p>
                    {importResult.errors > 0 && (
                      <p className="text-red-600">• 錯誤：{importResult.errors} 個</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {!importResult && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  相同客戶、相同產品、相同原料組合的訂單會自動合併為一個配方，並記錄生產次數。
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              {!importResult ? (
                <>
                  <Button
                    onClick={handleBatchImport}
                    disabled={importing}
                    className="flex-1"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        導入中...
                      </>
                    ) : (
                      '開始導入'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowImportDialog(false)}
                    disabled={importing}
                  >
                    取消
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    setShowImportDialog(false)
                    setImportResult(null)
                  }}
                  className="w-full"
                >
                  關閉
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LiquidGlassFooter />

      {/* Batch Analysis Modal */}
      <BatchAnalysisModal
        isOpen={showBatchAnalysisModal}
        onClose={() => setShowBatchAnalysisModal(false)}
        recipes={unanalyzedRecipes}
        onComplete={handleBatchAnalysisComplete}
      />

      {/* Recipe Review Drawer */}
      {drawer}
    </div>
  )
}

// Recipe Grid Component
function RecipeGrid({ recipes, router, viewMode, onMarketingAnalysis, onGranulationAnalysis, onAnalyzeEffects, analyzingRecipeId, failedRecipes, onEffectFilterClick, onExport, onDelete }: { 
  recipes: RecipeLibraryItem[], 
  router: any, 
  viewMode: 'list' | 'card',
  onMarketingAnalysis?: (id: string) => void,
  onGranulationAnalysis?: (id: string) => void,
  onAnalyzeEffects?: (id: string) => void,
  analyzingRecipeId?: string | null,
  failedRecipes?: Set<string>,
  onEffectFilterClick?: (category: string) => void,
  onExport?: (id: string) => void,
  onDelete?: (id: string) => void
}) {
  // Get analysis status for a recipe
  const getAnalysisStatus = (recipe: RecipeLibraryItem): 'analyzed' | 'analyzing' | 'failed' | 'not-analyzed' => {
    if (analyzingRecipeId === recipe.id) return 'analyzing'
    if (failedRecipes?.has(recipe.id)) return 'failed'
    if (recipe.aiEffectsAnalysis) return 'analyzed'
    return 'not-analyzed'
  }
  // List View
  if (viewMode === 'list') {
    return (
      <div className="space-y-3">
        {recipes.map((recipe) => (
          <RecipeListItem
            key={recipe.id}
            recipe={recipe}
            onView={(id) => router.push(`/recipe-library/${id}`)}
            onEdit={recipe.recipeType === 'template' ? (id) => {
              // Navigate to edit page or open edit dialog
              router.push(`/recipe-library/${id}`)
            } : undefined}
            onCreateOrder={recipe.recipeType === 'production' ? (id) => router.push(`/orders/new?recipeId=${id}`) : undefined}
            onMarketingAnalysis={onMarketingAnalysis}
            onGranulationAnalysis={onGranulationAnalysis}
            onAnalyzeEffects={onAnalyzeEffects}
            analysisStatus={getAnalysisStatus(recipe)}
            onEffectFilterClick={onEffectFilterClick}
            onExport={onExport}
            onDelete={onDelete}
          />
        ))}
      </div>
    )
  }
  
  // Card View (existing)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {recipes.map((recipe) => (
        <Card
          key={recipe.id}
          className="liquid-glass-card liquid-glass-card-elevated liquid-glass-card-interactive cursor-pointer"
          onClick={() => router.push(`/recipe-library/${recipe.id}`)}
        >
          <div className="liquid-glass-content p-6">
            <div className="flex items-start gap-3 mb-3">
              <IconContainer 
                icon={recipe.recipeType === 'template' ? Sparkles : Beaker} 
                variant={recipe.recipeType === 'template' ? 'primary' : 'info'} 
                size="sm" 
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-neutral-800 truncate mb-1 text-sm sm:text-base">
                  {recipe.recipeName}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 truncate">
                  {recipe.customerName}
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-600">
                <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{recipe.ingredients.length} 項原料</span>
              </div>
              
              {/* Type Badge */}
              <div className="flex flex-wrap gap-1">
                <Badge 
                  variant={recipe.recipeType === 'production' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {recipe.recipeType === 'production' ? '生產配方' : '模板配方'}
                </Badge>
                {recipe.sourceType === 'batch_import' && (
                  <Badge variant="outline" className="text-xs">批量導入</Badge>
                )}
              </div>

              {recipe.capsuleSize && (
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    {recipe.capsuleSize}
                  </Badge>
                  {recipe.capsuleColor && (
                    <Badge variant="outline" className="text-xs">
                      {recipe.capsuleColor}
                    </Badge>
                  )}
                </div>
              )}
              
              {recipe.aiEffectsAnalysis && (
                <div className="mt-2">
                  <Badge variant="secondary" className="bg-primary-50 text-primary-700 text-xs line-clamp-1">
                    {recipe.aiEffectsAnalysis}
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
              <div className="text-xs text-neutral-500">
                {recipe.recipeType === 'production' && (
                  <>生產 {recipe.productionCount} 次</>
                )}
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex items-center gap-1 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/recipe-library/${recipe.id}`)
                  }}
                >
                  <Eye className="h-3 w-3" />
                  <span className="hidden sm:inline">查看</span>
                </Button>
                
                {/* Quick Actions Menu */}
                <RecipeActionsMenu
                  recipe={recipe}
                  onView={(id) => router.push(`/recipe-library/${id}`)}
                  onEdit={recipe.recipeType === 'template' ? (id) => router.push(`/recipe-library/${id}`) : undefined}
                  onAnalyzeEffects={onAnalyzeEffects}
                  onMarketingAnalysis={onMarketingAnalysis}
                  onGranulationAnalysis={onGranulationAnalysis}
                  onCreateOrder={recipe.recipeType === 'production' ? (id) => router.push(`/orders/new?recipeId=${id}`) : undefined}
                  onExport={onExport}
                  onDelete={onDelete}
                  analysisStatus={getAnalysisStatus(recipe)}
                />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// Pagination Component
function Pagination({ page, totalPages, onPageChange }: { 
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className="flex justify-center gap-2 mt-8">
      <Button
        variant="outline"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        上一頁
      </Button>
      <span className="flex items-center px-4 text-sm text-neutral-600">
        第 {page} / {totalPages} 頁
      </span>
      <Button
        variant="outline"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
      >
        下一頁
      </Button>
    </div>
  )
}
