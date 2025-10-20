import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { RecipeSearchFilters, RecipeLibraryItem } from '@/types'
import { getRecipeCategories, EFFECT_CATEGORIES } from '@/lib/parse-effects'

// 標記為動態路由（因為使用了查詢參數）
export const dynamic = 'force-dynamic'

/**
 * GET /api/recipes
 * 獲取配方列表（支援搜尋、篩選、分頁）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // 解析查詢參數（確保空字符串被視為 undefined）
    const keyword = searchParams.get('keyword')?.trim() || undefined
    const ingredientName = searchParams.get('ingredientName')?.trim() || undefined
    const customerName = searchParams.get('customerName')?.trim() || undefined
    const productName = searchParams.get('productName')?.trim() || undefined
    const category = searchParams.get('category')?.trim() || undefined
    const capsuleSize = searchParams.get('capsuleSize')?.trim() || undefined
    const capsuleType = searchParams.get('capsuleType')?.trim() || undefined
    const recipeType = searchParams.get('recipeType') as 'production' | 'template' | 'all' | null // 🆕 配方類型篩選
    const effectCategories = searchParams.get('effectCategories')?.split(',').filter(Boolean) || [] // 🆕 功效類別篩選
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '30')
    const sortBy = (searchParams.get('sortBy') as RecipeSearchFilters['sortBy']) || 'lastProductionAt'
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'

    // 構建 where 條件
    const where: any = {
      isActive: true,
      AND: []
    }

    // 🆕 配方類型篩選
    if (recipeType && recipeType !== 'all') {
      where.AND.push({ recipeType })
    }

    // 關鍵字搜尋（配方名稱、客戶、產品、描述、功效）
    if (keyword) {
      where.AND.push({
        OR: [
          { recipeName: { contains: keyword, mode: 'insensitive' } },
          { customerName: { contains: keyword, mode: 'insensitive' } },
          { productName: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
          { aiEffectsAnalysis: { contains: keyword, mode: 'insensitive' } }
        ]
      })
    }

    // 🆕 功效類別篩選（服務器端）
    if (effectCategories.length > 0) {
      const effectConditions = effectCategories.map(category => {
        const categoryData = EFFECT_CATEGORIES[category as keyof typeof EFFECT_CATEGORIES]
        const keywords = categoryData?.keywords || []
        if (keywords.length === 0) return null
        
        return {
          OR: keywords.map(keyword => ({
            aiEffectsAnalysis: { contains: keyword, mode: 'insensitive' as const }
          }))
        }
      }).filter(Boolean)
      
      if (effectConditions.length > 0) {
        where.AND.push(...effectConditions)
      }
    }

    // 客戶名稱
    if (customerName) {
      where.AND.push({
        customerName: { contains: customerName, mode: 'insensitive' }
      })
    }

    // 產品名稱
    if (productName) {
      where.AND.push({
        productName: { contains: productName, mode: 'insensitive' }
      })
    }

    // 分類
    if (category) {
      where.AND.push({ category })
    }

    // 膠囊規格
    if (capsuleSize) {
      where.AND.push({ capsuleSize })
    }

    if (capsuleType) {
      where.AND.push({ capsuleType })
    }

    // 日期範圍（基於創建日期）
    if (dateFrom || dateTo) {
      const dateFilter: any = {}
      if (dateFrom) dateFilter.gte = dateFrom
      if (dateTo) dateFilter.lte = dateTo
      where.AND.push({ createdAt: dateFilter })
    }

    // 如果 AND 為空，移除它
    if (where.AND.length === 0) {
      delete where.AND
    }

    // 🆕 原料篩選（後端過濾，因為 Prisma 不原生支持 JSONB 數組搜索）
    let allRecipes: any[]
    let filteredRecipes: any[]
    
    if (ingredientName) {
      // 如果有原料篩選，我們需要獲取更多數據然後在內存中過濾
      // 這不是最優的，但確保功能正常
      allRecipes = await prisma.recipeLibrary.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
      })
      
      // 在內存中過濾包含指定原料的配方
      filteredRecipes = allRecipes.filter(recipe => {
        const ingredients = JSON.parse(recipe.ingredients)
        return ingredients.some((ing: any) => 
          ing.materialName.toLowerCase().includes(ingredientName.toLowerCase())
        )
      })
      
      // 手動分頁
      const total = filteredRecipes.length
      const totalPages = Math.ceil(total / limit)
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedRecipes = filteredRecipes.slice(startIndex, endIndex)
      
      // 轉換資料格式
      const formattedRecipes: RecipeLibraryItem[] = paginatedRecipes.map(recipe => ({
        ...recipe,
        sourceOrderIds: JSON.parse(recipe.sourceOrderIds) as string[],
        ingredients: JSON.parse(recipe.ingredients),
        tags: recipe.tags ? JSON.parse(recipe.tags) as string[] : [],
        completionDate: recipe.lastProductionAt,
        lastProductionAt: recipe.lastProductionAt,
        notes: recipe.notes || undefined,
        recipeType: recipe.recipeType as 'production' | 'template',
        sourceType: recipe.sourceType as 'order' | 'manual' | 'batch_import'
      }))
      
      // 類別統計（基於過濾後的結果）
      let categoryCounts: Record<string, number> = { all: total }
      if (effectCategories.length === 0) {
        Object.keys(EFFECT_CATEGORIES).forEach(key => {
          categoryCounts[key] = filteredRecipes.filter(recipe => 
            getRecipeCategories(recipe.aiEffectsAnalysis).includes(key)
          ).length
        })
        categoryCounts.uncategorized = filteredRecipes.filter(recipe => 
          getRecipeCategories(recipe.aiEffectsAnalysis).includes('uncategorized')
        ).length
      }
      
      return NextResponse.json({
        success: true,
        data: {
          recipes: formattedRecipes,
          pagination: {
            page,
            limit,
            total,
            totalPages
          },
          categoryCounts
        }
      })
    }

    // 沒有原料篩選，正常查詢
    const total = await prisma.recipeLibrary.count({ where })

    // 查詢配方列表
    const recipes = await prisma.recipeLibrary.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit
    })

    // 轉換資料格式
    const formattedRecipes: RecipeLibraryItem[] = recipes.map(recipe => ({
      ...recipe,
      sourceOrderIds: JSON.parse(recipe.sourceOrderIds) as string[],
      ingredients: JSON.parse(recipe.ingredients),
      tags: recipe.tags ? JSON.parse(recipe.tags) as string[] : [],
      completionDate: recipe.lastProductionAt,
      lastProductionAt: recipe.lastProductionAt,
      notes: recipe.notes || undefined,
      recipeType: recipe.recipeType as 'production' | 'template', // 🆕 類型轉換
      sourceType: recipe.sourceType as 'order' | 'manual' | 'batch_import' // 🆕 類型轉換
    }))

    // 🆕 優化：類別統計只在未選擇功效篩選時計算
    let categoryCounts: Record<string, number> = { all: total }
    
    // 如果沒有功效篩選，計算各類別數量
    if (effectCategories.length === 0) {
      const allRecipesForCounts = await prisma.recipeLibrary.findMany({
        where,
        select: {
          id: true,
          aiEffectsAnalysis: true
        }
      })
      
      Object.keys(EFFECT_CATEGORIES).forEach(key => {
        categoryCounts[key] = allRecipesForCounts.filter(recipe => 
          getRecipeCategories(recipe.aiEffectsAnalysis).includes(key)
        ).length
      })
      
      categoryCounts.uncategorized = allRecipesForCounts.filter(recipe => 
        getRecipeCategories(recipe.aiEffectsAnalysis).includes('uncategorized')
      ).length
    }

    return NextResponse.json({
      success: true,
      data: {
        recipes: formattedRecipes,
        pagination: {
          page,
          limit,
          total: ingredientName ? formattedRecipes.length : total,
          totalPages: ingredientName ? Math.ceil(formattedRecipes.length / limit) : Math.ceil(total / limit)
        },
        categoryCounts // 🆕 添加類別統計
      }
    })

  } catch (error) {
    console.error('獲取配方列表錯誤:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '獲取配方列表失敗'
    }, { status: 500 })
  }
}

