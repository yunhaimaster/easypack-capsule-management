import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 檢查表是否存在
    let hasTable = false
    let recipes: any[] = []
    let total = 0
    
    try {
      // 先檢查表是否存在
      await prisma.$queryRaw`SELECT 1 FROM "ai_recipes" LIMIT 1`
      hasTable = true
      
      // 如果表存在，獲取數據
      const [recipesData, totalCount] = await Promise.all([
        prisma.aIRecipe.findMany({
          skip: offset,
          take: limit,
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.aIRecipe.count()
      ])
      recipes = recipesData
      total = totalCount
    } catch (dbError: any) {
      console.warn('AI配方表不存在或無法訪問:', dbError)
      hasTable = false
      recipes = []
      total = 0
    }

    return NextResponse.json({
      success: true,
      recipes: recipes.map(recipe => ({
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        targetEffect: recipe.targetEffect,
        targetAudience: recipe.targetAudience,
        dosageForm: recipe.dosageForm,
        efficacyScore: recipe.efficacyScore,
        safetyScore: recipe.safetyScore,
        isActive: recipe.isActive,
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt
      })),
      total,
      hasTable
    })

  } catch (error) {
    console.error('獲取AI配方列表錯誤:', error)
    return NextResponse.json(
      { success: false, error: '獲取配方列表失敗' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少配方ID' },
        { status: 400 }
      )
    }

    try {
      await prisma.aIRecipe.delete({
        where: { id }
      })

      return NextResponse.json({
        success: true,
        message: '配方已刪除'
      })
    } catch (dbError) {
      console.warn('AI配方表不存在:', dbError)
      return NextResponse.json(
        { success: false, error: '配方表不存在' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('刪除AI配方錯誤:', error)
    return NextResponse.json(
      { success: false, error: '刪除配方失敗' },
      { status: 500 }
    )
  }
}
