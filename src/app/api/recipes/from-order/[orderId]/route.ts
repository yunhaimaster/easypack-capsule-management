import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateRecipeFingerprint } from '@/lib/recipe-fingerprint'
import type { RecipeIngredient } from '@/types'

function buildOrderNotes(order: { processIssues: string | null; qualityNotes: string | null }) {
  const noteParts: string[] = []
  if (order.processIssues && order.processIssues.trim()) {
    noteParts.push(`【製程問題】\n${order.processIssues.trim()}`)
  }
  if (order.qualityNotes && order.qualityNotes.trim()) {
    noteParts.push(`【品管備註】\n${order.qualityNotes.trim()}`)
  }
  return noteParts.length > 0 ? noteParts.join('\n\n') : null
}

/**
 * POST /api/recipes/from-order/[orderId]
 * 從已完成的訂單保存為配方（含智能去重）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params
    const body = await request.json().catch(() => ({}))
    const { recipeName, description, category, tags, notes } = body

    // 1. 查詢訂單及其原料
    const order = await prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: { ingredients: true }
    })

    if (!order) {
      return NextResponse.json({
        success: false,
        error: '訂單不存在'
      }, { status: 404 })
    }

    // 2. 檢查訂單是否已完成
    if (!order.completionDate) {
      return NextResponse.json({
        success: false,
        error: '只有已完成的訂單才能保存為配方'
      }, { status: 400 })
    }

    // 3. 檢查是否有原料
    if (!order.ingredients || order.ingredients.length === 0) {
      return NextResponse.json({
        success: false,
        error: '訂單沒有原料資料，無法保存為配方'
      }, { status: 400 })
    }

    // 4. 生成配方指紋
    const fingerprint = generateRecipeFingerprint(
      order.customerName,
      order.productName,
      order.ingredients
    )

    // 5. 檢查配方是否已存在
    const existingRecipe = await prisma.recipeLibrary.findUnique({
      where: { recipeFingerprint: fingerprint }
    })

    if (existingRecipe) {
      // 配方已存在：更新生產次數和來源訂單
      const sourceIds = JSON.parse(existingRecipe.sourceOrderIds) as string[]
      
      // 檢查此訂單是否已記錄
      if (sourceIds.includes(orderId)) {
        return NextResponse.json({
          success: true,
          data: {
            ...existingRecipe,
            sourceOrderIds: sourceIds,
            ingredients: JSON.parse(existingRecipe.ingredients),
            tags: existingRecipe.tags ? JSON.parse(existingRecipe.tags) : []
          },
          message: '此訂單已在配方庫中記錄',
          isDuplicate: true,
          alreadyRecorded: true
        })
      }

      // 更新配方
      sourceIds.push(orderId)
      
      // 如果訂單有新的備註，合併到現有備註
      let updatedNotes = existingRecipe.notes ? existingRecipe.notes.trim() : ''
      const newNotes = buildOrderNotes(order)
      if (newNotes) {
        updatedNotes = updatedNotes
          ? `${updatedNotes}\n\n---\n\n${newNotes}`
          : newNotes
      }
      
      const updated = await prisma.recipeLibrary.update({
        where: { id: existingRecipe.id },
        data: {
          productionCount: sourceIds.length,
          sourceOrderIds: JSON.stringify(sourceIds),
          lastProductionAt: order.completionDate,
          notes: updatedNotes || null,
          isActive: true,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          ...updated,
          sourceOrderIds: sourceIds,
          ingredients: JSON.parse(updated.ingredients),
          tags: updated.tags ? JSON.parse(updated.tags) : []
        },
        message: `配方已存在，已更新生產記錄（第 ${updated.productionCount} 次生產）`,
        isDuplicate: true,
        alreadyRecorded: false
      })
    }

    // 6. 新配方：創建記錄
    const recipeIngredients: RecipeIngredient[] = order.ingredients.map(ing => ({
      materialName: ing.materialName,
      unitContentMg: ing.unitContentMg,
      isCustomerProvided: ing.isCustomerProvided,
      isCustomerSupplied: ing.isCustomerSupplied
    }))

    // 合併訂單的製程問題和品管備註到配方備註
    let combinedNotes = notes || ''
    if (order.processIssues || order.qualityNotes) {
      const noteParts: string[] = []
      if (order.processIssues) {
        noteParts.push(`【製程問題】\n${order.processIssues}`)
      }
      if (order.qualityNotes) {
        noteParts.push(`【品管備註】\n${order.qualityNotes}`)
      }
      combinedNotes = noteParts.join('\n\n')
    }

    const recipe = await prisma.recipeLibrary.create({
      data: {
        recipeName: recipeName || order.productName,
        description: description || null,
        customerName: order.customerName,
        productName: order.productName,
        ingredients: JSON.stringify(recipeIngredients),
        unitWeightMg: order.unitWeightMg,
        capsuleColor: order.capsuleColor,
        capsuleSize: order.capsuleSize,
        capsuleType: order.capsuleType,
        recipeFingerprint: fingerprint,
        sourceOrderIds: JSON.stringify([orderId]),
        productionCount: 1,
        lastProductionAt: order.completionDate,
        category: category || null,
        tags: tags ? JSON.stringify(tags) : null,
        notes: combinedNotes || null
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...recipe,
        sourceOrderIds: [orderId],
        ingredients: recipeIngredients,
        tags: tags || []
      },
      message: '配方已成功保存',
      isDuplicate: false
    })

  } catch (error) {
    console.error('保存配方錯誤:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '保存配方失敗'
    }, { status: 500 })
  }
}

/**
 * GET /api/recipes/from-order/[orderId]
 * 檢查訂單是否可以保存為配方
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params

    const order = await prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: { ingredients: true }
    })

    if (!order) {
      return NextResponse.json({
        success: true,
        data: {
          canSave: false,
          reason: 'notFound',
          alreadyExists: false
        }
      })
    }

    if (!order.completionDate) {
      return NextResponse.json({
        success: true,
        data: {
          canSave: false,
          reason: 'notCompleted',
          alreadyExists: false
        }
      })
    }

    if (!order.ingredients || order.ingredients.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          canSave: false,
          reason: 'noIngredients',
          alreadyExists: false
        }
      })
    }

    const fingerprint = generateRecipeFingerprint(
      order.customerName,
      order.productName,
      order.ingredients
    )

    const existingRecipe = await prisma.recipeLibrary.findUnique({
      where: { recipeFingerprint: fingerprint }
    })

    if (existingRecipe) {
      const sourceIds = JSON.parse(existingRecipe.sourceOrderIds) as string[]
      const alreadyRecorded = sourceIds.includes(orderId)

      return NextResponse.json({
        success: true,
        data: {
          canSave: true,
          alreadyExists: true,
          alreadyRecorded,
          existingRecipe: {
            ...existingRecipe,
            sourceOrderIds: sourceIds,
            ingredients: JSON.parse(existingRecipe.ingredients),
            tags: existingRecipe.tags ? JSON.parse(existingRecipe.tags) : []
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        canSave: true,
        alreadyExists: false,
        alreadyRecorded: false,
        existingRecipe: null
      }
    })

  } catch (error) {
    console.error('檢查配方錯誤:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '檢查配方失敗'
    }, { status: 500 })
  }
}

