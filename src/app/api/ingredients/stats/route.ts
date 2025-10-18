import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

function hasValidDatabaseUrl() {
  const url = process.env.DATABASE_URL
  return Boolean(url && (url.startsWith('postgres://') || url.startsWith('postgresql://')))
}

export async function GET(request: NextRequest) {
  try {
    if (!hasValidDatabaseUrl()) {
      logger.warn('Ingredient stats requested without valid DATABASE_URL')
      return NextResponse.json({
        ingredients: [],
        totalWeight: 0,
        summary: {
          totalIngredients: 0,
          highRiskIngredients: 0,
          mediumRiskIngredients: 0,
          lowRiskIngredients: 0
        }
      })
    }

    // 獲取所有原料使用統計
    const ingredientStats = await prisma.ingredient.groupBy({
      by: ['materialName'],
      _sum: {
        unitContentMg: true
      },
      _count: {
        id: true
      }
    })

    // 獲取所有訂單的總重量
    const totalWeightResult = await prisma.productionOrder.aggregate({
      _sum: {
        batchTotalWeightMg: true
      }
    })

    const totalWeight = totalWeightResult._sum.batchTotalWeightMg || 0

    // 計算每個原料的統計數據
    const stats = ingredientStats.map(ingredient => {
      const totalUsage = ingredient._sum.unitContentMg || 0
      const usageCount = ingredient._count.id
      const weightPercentage = totalWeight > 0 ? (totalUsage / totalWeight) * 100 : 0
      
      // 根據原料名稱判斷難度風險指數
      const riskLevel = calculateRiskLevel(ingredient.materialName)
      
      return {
        materialName: ingredient.materialName,
        totalUsageMg: totalUsage,
        usageCount,
        weightPercentage: Number(weightPercentage.toFixed(2)),
        riskLevel,
        riskScore: riskLevel.score,
        riskDescription: riskLevel.description
      }
    })

    // 按使用量排序
    stats.sort((a, b) => b.totalUsageMg - a.totalUsageMg)

    return NextResponse.json({
      ingredients: stats,
      totalWeight,
      summary: {
        totalIngredients: stats.length,
        highRiskIngredients: stats.filter(s => s.riskScore >= 7).length,
        mediumRiskIngredients: stats.filter(s => s.riskScore >= 4 && s.riskScore < 7).length,
        lowRiskIngredients: stats.filter(s => s.riskScore < 4).length
      }
    })
  } catch (error) {
    console.error('Error fetching ingredient stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ingredient statistics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// 根據原料名稱判斷難度風險指數
function calculateRiskLevel(materialName: string): { score: number; description: string } {
  const name = materialName.toLowerCase()
  
  // 高風險原料 (7-10分)
  if (name.includes('粉末') || name.includes('粉') || name.includes('powder')) {
    return { score: 8, description: '粉末狀原料，容易飛散，灌裝難度較高' }
  }
  if (name.includes('油') || name.includes('oil') || name.includes('脂')) {
    return { score: 9, description: '油性原料，黏性高，灌裝困難' }
  }
  if (name.includes('膠') || name.includes('gel') || name.includes('膠囊')) {
    return { score: 7, description: '膠狀原料，流動性差，需要特殊處理' }
  }
  
  // 中風險原料 (4-6分)
  if (name.includes('提取') || name.includes('extract') || name.includes('濃縮')) {
    return { score: 5, description: '提取物，濃度較高，需要精確控制' }
  }
  if (name.includes('維生素') || name.includes('vitamin') || name.includes('維他命')) {
    return { score: 4, description: '維生素類，需要均勻混合' }
  }
  if (name.includes('礦物質') || name.includes('mineral') || name.includes('鈣') || name.includes('鐵')) {
    return { score: 5, description: '礦物質類，密度較高，需要充分混合' }
  }
  
  // 低風險原料 (1-3分)
  if (name.includes('澱粉') || name.includes('starch') || name.includes('填充')) {
    return { score: 2, description: '填充劑，流動性好，灌裝容易' }
  }
  if (name.includes('糖') || name.includes('sugar') || name.includes('甜味')) {
    return { score: 3, description: '糖類，流動性良好，灌裝容易' }
  }
  if (name.includes('植物') || name.includes('herb') || name.includes('草本')) {
    return { score: 4, description: '植物原料，需要充分粉碎' }
  }
  
  // 默認中等風險
  return { score: 5, description: '一般原料，需要標準處理流程' }
}
