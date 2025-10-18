import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/recipes/batch-analyze-effects
 * 批量分析配方功效（針對未分析的配方）
 */
export async function POST(request: NextRequest) {
  try {
    const results = {
      analyzed: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Loop until no more recipes to analyze
    let hasMore = true
    while (hasMore) {
      // 1. Query next batch of unanalyzed recipes (limit 20)
      const recipesToAnalyze = await prisma.recipeLibrary.findMany({
        where: {
          aiEffectsAnalysis: null,
          isActive: true
        },
        select: {
          id: true,
          recipeName: true
        },
        take: 20,
        orderBy: {
          createdAt: 'desc'
        }
      })

      if (recipesToAnalyze.length === 0) {
        hasMore = false
        break
      }

      // 2. Process this batch
      for (let i = 0; i < recipesToAnalyze.length; i++) {
        const recipe = recipesToAnalyze[i]
        
        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://capsuledb.easyhealth.internal'
          const response = await fetch(`${baseUrl}/api/recipes/${recipe.id}/analyze-effects`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          })

          const result = await response.json()

          if (result.success) {
            results.analyzed++
          } else {
            results.failed++
            results.errors.push(`${recipe.recipeName}: ${result.error}`)
          }

        } catch (error) {
          results.failed++
          results.errors.push(
            `${recipe.recipeName}: ${error instanceof Error ? error.message : '未知錯誤'}`
          )
        }

        // Delay between individual recipes
        if (i < recipesToAnalyze.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      // Small delay between batches
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return NextResponse.json({
      success: true,
      analyzed: results.analyzed,
      failed: results.failed,
      remaining: 0,
      errors: results.errors.length > 0 ? results.errors : undefined,
      message: `批量分析完成：成功 ${results.analyzed} 個，失敗 ${results.failed} 個`
    })

  } catch (error) {
    console.error('批量分析錯誤:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '批量分析失敗'
    }, { status: 500 })
  }
}

/**
 * GET /api/recipes/batch-analyze-effects
 * 查詢待分析配方數量
 */
export async function GET(request: NextRequest) {
  try {
    const count = await prisma.recipeLibrary.count({
      where: {
        aiEffectsAnalysis: null,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        pendingCount: count
      }
    })

  } catch (error) {
    console.error('查詢待分析配方錯誤:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '查詢失敗'
    }, { status: 500 })
  }
}

