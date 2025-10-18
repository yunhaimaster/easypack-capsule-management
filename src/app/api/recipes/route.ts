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

    // 解析查詢參數
    const keyword = searchParams.get('keyword') || undefined
    const ingredientName = searchParams.get('ingredientName') || undefined
    const customerName = searchParams.get('customerName') || undefined
    const productName = searchParams.get('productName') || undefined
    const category = searchParams.get('category') || undefined
    const capsuleSize = searchParams.get('capsuleSize') || undefined
    const capsuleType = searchParams.get('capsuleType') || undefined
    const recipeType = searchParams.get('recipeType') as 'production' | 'template' | 'all' | null // 🆕 配方類型篩選
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

    // 關鍵字搜尋（配方名稱、客戶、產品）
    if (keyword) {
      where.AND.push({
        OR: [
          { recipeName: { contains: keyword, mode: 'insensitive' } },
          { customerName: { contains: keyword, mode: 'insensitive' } },
          { productName: { contains: keyword, mode: 'insensitive' } }
        ]
      })
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

    // 查詢總數
    const total = await prisma.recipeLibrary.count({ where })

    // 查詢配方列表
    let recipes = await prisma.recipeLibrary.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit
    })

    // 如果需要按原料篩選，需要在查詢後過濾（因為 JSON 欄位無法直接查詢）
    if (ingredientName) {
      recipes = recipes.filter(recipe => {
        try {
          const ingredients = JSON.parse(recipe.ingredients) as Array<{ materialName: string }>
          return ingredients.some(ing =>
            ing.materialName.toLowerCase().includes(ingredientName.toLowerCase())
          )
        } catch {
          return false
        }
      })
    }

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

    // 計算類別統計（基於所有符合 where 條件的配方，不僅限於當前頁）
    const allRecipesForCounts = await prisma.recipeLibrary.findMany({
      where,
      select: {
        id: true,
        aiEffectsAnalysis: true
      }
    })

    const categoryCounts: Record<string, number> = { all: allRecipesForCounts.length }
    
    Object.keys(EFFECT_CATEGORIES).forEach(key => {
      categoryCounts[key] = allRecipesForCounts.filter(recipe => 
        getRecipeCategories(recipe.aiEffectsAnalysis).includes(key)
      ).length
    })
    
    categoryCounts.uncategorized = allRecipesForCounts.filter(recipe => 
      getRecipeCategories(recipe.aiEffectsAnalysis).includes('uncategorized')
    ).length

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

