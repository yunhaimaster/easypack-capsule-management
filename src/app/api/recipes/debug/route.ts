import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/recipes/debug
 * 調試 API - 查看配方的實際數據
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const recipeId = searchParams.get('id')
    
    if (!recipeId) {
      return NextResponse.json({
        success: false,
        error: 'Missing recipe ID'
      }, { status: 400 })
    }

    const recipe = await prisma.recipeLibrary.findUnique({
      where: { id: recipeId }
    })

    if (!recipe) {
      return NextResponse.json({
        success: false,
        error: 'Recipe not found'
      }, { status: 404 })
    }

    // 查詢來源訂單的備註
    const sourceOrderIds = JSON.parse(recipe.sourceOrderIds) as string[]
    const orders = await prisma.productionOrder.findMany({
      where: {
        id: { in: sourceOrderIds }
      },
      select: {
        id: true,
        customerName: true,
        productName: true,
        processIssues: true,
        qualityNotes: true,
        completionDate: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        recipe: {
          id: recipe.id,
          recipeName: recipe.recipeName,
          isActive: recipe.isActive,
          notes: recipe.notes,
          notesLength: recipe.notes?.length || 0,
          notesIsNull: recipe.notes === null,
          notesIsEmpty: recipe.notes === '',
          aiEffectsAnalysis: recipe.aiEffectsAnalysis,
          aiAnalyzedAt: recipe.aiAnalyzedAt,
          sourceOrderIds: sourceOrderIds
        },
        sourceOrders: orders.map(order => ({
          id: order.id,
          customerName: order.customerName,
          productName: order.productName,
          processIssues: order.processIssues,
          processIssuesLength: order.processIssues?.length || 0,
          qualityNotes: order.qualityNotes,
          qualityNotesLength: order.qualityNotes?.length || 0,
          completionDate: order.completionDate
        }))
      }
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Debug failed'
    }, { status: 500 })
  }
}

