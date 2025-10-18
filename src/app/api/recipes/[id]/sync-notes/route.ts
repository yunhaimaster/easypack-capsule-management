import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function buildOrderNotes(processIssues?: string | null, qualityNotes?: string | null) {
  const noteParts: string[] = []
  if (processIssues && processIssues.trim()) {
    noteParts.push(`【製程問題】\n${processIssues.trim()}`)
  }
  if (qualityNotes && qualityNotes.trim()) {
    noteParts.push(`【品管備註】\n${qualityNotes.trim()}`)
  }
  return noteParts.length > 0 ? noteParts.join('\n\n') : null
}

export const dynamic = 'force-dynamic'

/**
 * POST /api/recipes/[id]/sync-notes
 * 從來源訂單同步備註到配方
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // 1. 查詢配方
    const recipe = await prisma.recipeLibrary.findUnique({
      where: { id }
    })

    if (!recipe) {
      return NextResponse.json({
        success: false,
        error: '配方不存在'
      }, { status: 404 })
    }

    // 2. 查詢來源訂單
    const sourceOrderIds = JSON.parse(recipe.sourceOrderIds) as string[]
    const orders = await prisma.productionOrder.findMany({
      where: {
        id: { in: sourceOrderIds }
      },
      select: {
        id: true,
        processIssues: true,
        qualityNotes: true
      }
    })

    // 3. 合併所有訂單的備註
    const allNotes: string[] = []
    
    for (const order of orders) {
      const notes = buildOrderNotes(order.processIssues, order.qualityNotes)
      if (notes) {
        allNotes.push(notes)
      }
    }

    // 4. 更新配方備註
    const combinedNotes = allNotes.length > 0 ? allNotes.join('\n\n---\n\n') : null

    const updated = await prisma.recipeLibrary.update({
      where: { id },
      data: {
        notes: combinedNotes
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        notes: updated.notes,
        ordersChecked: orders.length,
        notesFound: allNotes.length
      },
      message: combinedNotes 
        ? `已同步 ${allNotes.length} 個訂單的備註` 
        : '來源訂單沒有備註'
    })

  } catch (error) {
    console.error('同步備註錯誤:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '同步備註失敗'
    }, { status: 500 })
  }
}

