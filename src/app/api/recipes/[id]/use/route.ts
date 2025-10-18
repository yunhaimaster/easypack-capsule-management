import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/recipes/[id]/use
 * 獲取配方資料並更新使用統計（用於創建訂單）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const recipe = await prisma.recipeLibrary.findUnique({
      where: { id }
    })

    if (!recipe) {
      return NextResponse.json({
        success: false,
        error: '配方不存在'
      }, { status: 404 })
    }

    // 更新使用統計
    const updated = await prisma.recipeLibrary.update({
      where: { id },
      data: {
        usageCount: recipe.usageCount + 1,
        lastUsedAt: new Date()
      }
    })

    // 轉換資料格式
    const formattedRecipe = {
      ...updated,
      sourceOrderIds: JSON.parse(updated.sourceOrderIds) as string[],
      ingredients: JSON.parse(updated.ingredients),
      tags: updated.tags ? JSON.parse(updated.tags) as string[] : []
    }

    return NextResponse.json({
      success: true,
      data: formattedRecipe,
      message: '配方資料已載入'
    })

  } catch (error) {
    console.error('載入配方錯誤:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '載入配方失敗'
    }, { status: 500 })
  }
}

