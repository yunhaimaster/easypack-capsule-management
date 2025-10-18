import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少配方ID' },
        { status: 400 }
      )
    }

    // 檢查表是否存在
    let hasTable = false
    let recipe = null
    
    try {
      // 先檢查表是否存在
      await prisma.$queryRaw`SELECT 1 FROM "ai_recipes" LIMIT 1`
      hasTable = true
      
      // 如果表存在，獲取配方詳情
      recipe = await prisma.aIRecipe.findUnique({
        where: { id }
      })
    } catch (dbError: any) {
      console.warn('AI配方表不存在或無法訪問:', dbError)
      hasTable = false
    }

    if (!hasTable) {
      return NextResponse.json(
        { success: false, error: '數據庫表不存在' },
        { status: 404 }
      )
    }

    if (!recipe) {
      return NextResponse.json(
        { success: false, error: '配方不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      recipe: {
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        targetEffect: recipe.targetEffect,
        targetAudience: recipe.targetAudience,
        dosageForm: recipe.dosageForm,
        ingredients: recipe.ingredients,
        dosage: recipe.dosage,
        efficacyScore: recipe.efficacyScore,
        safetyScore: recipe.safetyScore,
        costAnalysis: recipe.costAnalysis,
        regulatoryStatus: recipe.regulatoryStatus,
        isActive: recipe.isActive,
        createdAt: recipe.createdAt.toISOString(),
        updatedAt: recipe.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('獲取AI配方詳情錯誤:', error)
    return NextResponse.json(
      { success: false, error: '獲取配方詳情失敗', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    )
  }
}
