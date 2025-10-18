import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const analysisType = searchParams.get('analysisType') || 'comprehensive'

    // 嘗試獲取訂單數據
    let ordersData: any[] = []
    try {
      ordersData = await prisma.productionOrder.findMany({
        include: {
          ingredients: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 100
      })
    } catch (dbError) {
      console.warn('訂單數據表不存在，使用空數據:', dbError)
      ordersData = []
    }

    // 從訂單中提取所有原料信息
    const ingredientMap = new Map()
    
    ordersData.forEach(order => {
      if (order.ingredients && Array.isArray(order.ingredients)) {
        order.ingredients.forEach((ingredient: any) => {
          const key = ingredient.materialName?.toLowerCase() || ''
          if (key) {
            if (!ingredientMap.has(key)) {
              ingredientMap.set(key, {
                materialName: ingredient.materialName,
                totalUsage: 0,
                orders: [],
                totalQuantity: 0,
                averageQuantity: 0,
                firstUsed: order.createdAt,
                lastUsed: order.createdAt,
                customers: new Set(),
                products: new Set()
              })
            }
            
            const ingredientData = ingredientMap.get(key)
            ingredientData.totalUsage += 1
            ingredientData.totalQuantity += ingredient.unitContentMg || 0
            ingredientData.orders.push({
              orderId: order.id,
              customerName: order.customerName,
              productName: order.productName,
              quantity: ingredient.unitContentMg,
              orderDate: order.createdAt
            })
            
            if (order.createdAt < ingredientData.firstUsed) {
              ingredientData.firstUsed = order.createdAt
            }
            if (order.createdAt > ingredientData.lastUsed) {
              ingredientData.lastUsed = order.createdAt
            }
            
            ingredientData.customers.add(order.customerName)
            ingredientData.products.add(order.productName)
          }
        })
      }
    })

    // 轉換為數組並計算統計數據
    const ingredients = Array.from(ingredientMap.values()).map(ingredient => ({
      ...ingredient,
      averageQuantity: ingredient.totalQuantity / ingredient.totalUsage,
      customerCount: ingredient.customers.size,
      productCount: ingredient.products.size,
      customers: Array.from(ingredient.customers),
      products: Array.from(ingredient.products),
      usageFrequency: ingredient.totalUsage,
      popularityScore: ingredient.totalUsage * ingredient.customerCount,
      recencyScore: new Date().getTime() - new Date(ingredient.lastUsed).getTime()
    }))

    // 按使用頻率排序
    ingredients.sort((a, b) => b.popularityScore - a.popularityScore)

    // 分析結果
    const analysis = {
      totalIngredients: ingredients.length,
      totalOrders: ordersData.length,
      mostPopular: ingredients.slice(0, 10),
      leastPopular: ingredients.slice(-10),
      recentIngredients: ingredients
        .filter(ing => {
          const daysSinceLastUse = (new Date().getTime() - new Date(ing.lastUsed).getTime()) / (1000 * 60 * 60 * 24)
          return daysSinceLastUse <= 30
        })
        .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
        .slice(0, 10),
      customerInsights: {
        totalCustomers: new Set(ordersData.map(order => order.customerName)).size,
        averageIngredientsPerOrder: ordersData.reduce((sum, order) => sum + (order.ingredients?.length || 0), 0) / ordersData.length
      }
    }

    return NextResponse.json({
      success: true,
      ingredients,
      analysis,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('提取原料數據錯誤:', error)
    return NextResponse.json(
      { success: false, error: '提取原料數據失敗，請稍後再試' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ingredientName, analysisType = 'detailed' } = await request.json()

    if (!ingredientName) {
      return NextResponse.json(
        { success: false, error: '缺少原料名稱參數' },
        { status: 400 }
      )
    }

    // 嘗試獲取特定原料的使用數據
    let ordersData: any[] = []
    try {
      ordersData = await prisma.productionOrder.findMany({
        include: {
          ingredients: true
        },
        where: {
          ingredients: {
            some: {
              materialName: {
                contains: ingredientName,
                mode: 'insensitive'
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50
      })
    } catch (dbError) {
      console.warn('訂單數據表不存在，使用空數據:', dbError)
      ordersData = []
    }

    // 分析特定原料的使用情況
    const ingredientUsage = {
      materialName: ingredientName,
      totalOrders: ordersData.length,
      totalQuantity: 0,
      averageQuantity: 0,
      customers: new Set(),
      products: new Set(),
      usageHistory: [] as any[],
      trends: {
        monthly: {} as any,
        quarterly: {} as any
      }
    }

    ordersData.forEach(order => {
      const ingredient = order.ingredients?.find((ing: any) => 
        ing.materialName?.toLowerCase().includes(ingredientName.toLowerCase())
      )
      
      if (ingredient) {
        ingredientUsage.totalQuantity += ingredient.unitContentMg || 0
        ingredientUsage.customers.add(order.customerName)
        ingredientUsage.products.add(order.productName)
        
        ingredientUsage.usageHistory.push({
          orderId: order.id,
          customerName: order.customerName,
          productName: order.productName,
          quantity: ingredient.unitContentMg,
          orderDate: order.createdAt
        })

        // 分析趨勢
        const month = new Date(order.createdAt).toISOString().slice(0, 7)
        const quarter = `${new Date(order.createdAt).getFullYear()}-Q${Math.ceil((new Date(order.createdAt).getMonth() + 1) / 3)}`
        
        if (!ingredientUsage.trends.monthly[month]) {
          ingredientUsage.trends.monthly[month] = { count: 0, quantity: 0 }
        }
        if (!ingredientUsage.trends.quarterly[quarter]) {
          ingredientUsage.trends.quarterly[quarter] = { count: 0, quantity: 0 }
        }
        
        ingredientUsage.trends.monthly[month].count += 1
        ingredientUsage.trends.monthly[month].quantity += ingredient.unitContentMg || 0
        ingredientUsage.trends.quarterly[quarter].count += 1
        ingredientUsage.trends.quarterly[quarter].quantity += ingredient.unitContentMg || 0
      }
    })

    ingredientUsage.averageQuantity = ingredientUsage.totalQuantity / ingredientUsage.totalOrders
    ingredientUsage.customers = Array.from(ingredientUsage.customers) as any
    ingredientUsage.products = Array.from(ingredientUsage.products) as any

    return NextResponse.json({
      success: true,
      ingredient: ingredientUsage,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('原料分析錯誤:', error)
    return NextResponse.json(
      { success: false, error: '原料分析失敗，請稍後再試' },
      { status: 500 }
    )
  }
}
