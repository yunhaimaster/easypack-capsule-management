'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProductionOrderForm } from '@/components/forms/production-order-form'
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, Loader2 } from 'lucide-react'
import type { RecipeLibraryItem } from '@/types'

function NewOrderContent() {
  const searchParams = useSearchParams()
  const recipeId = searchParams?.get('recipeId')
  const fromTemplate = searchParams?.get('fromTemplate') // 🆕 從模板創建
  
  const [recipe, setRecipe] = useState<RecipeLibraryItem | null>(null)
  const [loading, setLoading] = useState(!!(recipeId || fromTemplate))
  const [error, setError] = useState<string | null>(null)
  const [isFromTemplate, setIsFromTemplate] = useState(false) // 🆕 標記是否從模板創建

  useEffect(() => {
    if (recipeId) {
      loadRecipe(recipeId, false)
    } else if (fromTemplate) {
      loadRecipe(fromTemplate, true)
    }
  }, [recipeId, fromTemplate])

  const loadRecipe = async (id: string, fromTemplateFlag: boolean) => {
    try {
      setLoading(true)
      setIsFromTemplate(fromTemplateFlag) // 🆕 設置標記
      
      // Call use API to update usage count
      const response = await fetch(`/api/recipes/${id}/use`)
      const result = await response.json()

      if (result.success) {
        setRecipe(result.data)
      } else {
        setError(result.error || '無法載入配方')
      }
    } catch (error) {
      console.error('Load recipe error:', error)
      setError('無法連接到服務器')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen logo-bg-animation flex flex-col">
        <LiquidGlassNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-info-600 mb-4" />
            <p className="text-neutral-600">載入配方資料中...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen logo-bg-animation flex flex-col">
      {/* Liquid Glass Navigation */}
      <LiquidGlassNav />
      
      {/* Main Content with padding for fixed nav and sticky action bar */}
      <div className="pt-28 sm:pt-24 px-4 sm:px-6 md:px-8 space-y-8 floating-combined content-with-sticky-actions">
        <section className="liquid-glass-card liquid-glass-card-refraction p-6 md:p-8">
          <div className="liquid-glass-content flex items-center gap-4">
            <div className="icon-container icon-container-pink shadow-[0_12px_30px_rgba(236,72,153,0.25)]">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m6-6H6" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg md:text-lg font-semibold text-[--brand-neutral]">建立新配方</h1>
              <p className="text-xs md:text-xs text-neutral-600">輸入客戶、配方與原料資料以建立批次紀錄</p>
            </div>
          </div>
        </section>

        {/* Recipe loaded alert */}
        {recipe && !error && !isFromTemplate && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              已從配方庫載入配方「{recipe.recipeName}」，原料和膠囊規格已自動填充。
              請填寫客戶名稱和生產數量後提交訂單。
            </AlertDescription>
          </Alert>
        )}

        {/* 🆕 Template recipe alert */}
        {isFromTemplate && recipe && (
          <Alert className="bg-primary-50 border-primary-300">
            <Info className="h-4 w-4 text-primary-600" />
            <AlertDescription className="text-primary-700">
              正在從模板配方「{recipe.recipeName}」創建新訂單。請填寫客戶名稱和其他訂單信息。
            </AlertDescription>
          </Alert>
        )}

        {/* Error alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form Card */}
        <ProductionOrderForm
          initialData={recipe ? {
            customerName: isFromTemplate ? '' : recipe.customerName, // 🆕 模板配方時清空客戶名稱
            productName: recipe.productName,
            capsuleColor: recipe.capsuleColor || undefined,
            capsuleSize: (recipe.capsuleSize as "#1" | "#0" | "#00" | null) || null,
            capsuleType: (recipe.capsuleType as "明膠胃溶" | "植物胃溶" | "明膠腸溶" | "植物腸溶" | null) || null,
            ingredients: recipe.ingredients.map(ing => ({
              materialName: ing.materialName,
              unitContentMg: ing.unitContentMg,
              isCustomerProvided: ing.isCustomerProvided,
              isCustomerSupplied: ing.isCustomerSupplied
            }))
          } : undefined}
          allowEditProductName={isFromTemplate} // 🆕 从模板创建时允许编辑产品名称
          templateInfo={isFromTemplate && recipe ? {
            recipeName: recipe.recipeName,
            originalProductName: recipe.productName
          } : undefined} // 🆕 传递模板信息
        />
      </div>
    </div>
  )
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50">
        <LiquidGlassNav />
        <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        </div>
      </div>
    }>
      <NewOrderContent />
    </Suspense>
  )
}
