import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateRecipeFingerprint } from '@/lib/recipe-fingerprint'
import type { RecipeIngredient, BatchImportResult } from '@/types'

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

/**
 * POST /api/recipes/batch-import
 * 批量導入已完成訂單的配方（智能去重）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { orderIds } = body as { orderIds?: string[] }

    // 構建查詢條件
    const whereCondition: any = {
      completionDate: { not: null }
    }

    // 如果指定了訂單 ID，只處理這些訂單
    if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
      whereCondition.id = { in: orderIds }
    }

    // 查詢所有已完成的訂單
    const completedOrders = await prisma.productionOrder.findMany({
      where: whereCondition,
      include: { ingredients: true },
      orderBy: { completionDate: 'desc' }
    })

    const results: BatchImportResult = {
      total: completedOrders.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      details: []
    }

    // 逐個處理訂單
    for (const order of completedOrders) {
      try {
        // 檢查訂單是否有原料
        if (!order.ingredients || order.ingredients.length === 0) {
          results.skipped++
          results.details.push({
            orderId: order.id,
            status: 'skipped',
            message: '無原料資料'
          })
          continue
        }

        // 生成配方指紋
        const fingerprint = generateRecipeFingerprint(
          order.customerName,
          order.productName,
          order.ingredients
        )

        // 檢查配方是否已存在
        const existingRecipe = await prisma.recipeLibrary.findUnique({
          where: { recipeFingerprint: fingerprint }
        })

        if (existingRecipe) {
          // 配方已存在
          const sourceIds = JSON.parse(existingRecipe.sourceOrderIds) as string[]
          const orderAlreadyRecorded = sourceIds.includes(order.id)

          // 建立關於備註的合併邏輯
          const mergeNotes = () => {
            const currentNotes = existingRecipe.notes ? existingRecipe.notes.trim() : ''
            const newNotes = buildOrderNotes(order.processIssues, order.qualityNotes)
            if (!newNotes) return currentNotes || null
            return currentNotes ? `${currentNotes}\n\n---\n\n${newNotes}` : newNotes
          }

          if (orderAlreadyRecorded) {
            if (!existingRecipe.isActive) {
              const reactivate = await prisma.recipeLibrary.update({
                where: { id: existingRecipe.id },
                data: {
                  isActive: true,
                  lastProductionAt: order.completionDate,
                  notes: mergeNotes(),
                  updatedAt: new Date()
                }
              })

              results.updated++
              results.details.push({
                orderId: order.id,
                status: 'updated',
                message: `重新啟用配方「${reactivate.recipeName}」`
              })
            } else {
              // 此訂單已記錄且配方為啟用狀態，跳過
              results.skipped++
              results.details.push({
                orderId: order.id,
                status: 'skipped',
                message: '已在配方庫中記錄'
              })
            }
          } else {
            sourceIds.push(order.id)
            const updated = await prisma.recipeLibrary.update({
              where: { id: existingRecipe.id },
              data: {
                productionCount: sourceIds.length,
                sourceOrderIds: JSON.stringify(sourceIds),
                lastProductionAt: order.completionDate,
                notes: mergeNotes(),
                isActive: true,
                updatedAt: new Date()
              }
            })

            results.updated++
            results.details.push({
              orderId: order.id,
              status: 'updated',
              message: `更新配方「${updated.recipeName}」`
            })
          }
        } else {
          // 創建新配方
          const recipeIngredients: RecipeIngredient[] = order.ingredients.map(ing => ({
            materialName: ing.materialName,
            unitContentMg: ing.unitContentMg,
            isCustomerProvided: ing.isCustomerProvided,
            isCustomerSupplied: ing.isCustomerSupplied
          }))

          await prisma.recipeLibrary.create({
            data: {
              recipeName: order.productName,
              customerName: order.customerName,
              productName: order.productName,
              ingredients: JSON.stringify(recipeIngredients),
              unitWeightMg: order.unitWeightMg,
              capsuleColor: order.capsuleColor,
              capsuleSize: order.capsuleSize,
              capsuleType: order.capsuleType,
              recipeFingerprint: fingerprint,
              sourceOrderIds: JSON.stringify([order.id]),
              productionCount: 1,
              lastProductionAt: order.completionDate,
              notes: buildOrderNotes(order.processIssues, order.qualityNotes)
            }
          })
          
          results.imported++
          results.details.push({
            orderId: order.id,
            status: 'imported',
            message: `新增配方「${order.productName}」`
          })
        }
      } catch (error) {
        // 單個訂單處理失敗，記錄錯誤但繼續處理其他訂單
        results.errors++
        results.details.push({
          orderId: order.id,
          status: 'error',
          message: error instanceof Error ? error.message : '處理失敗'
        })
        console.error(`處理訂單 ${order.id} 時發生錯誤:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `批量導入完成：新增 ${results.imported} 個配方，更新 ${results.updated} 個配方，跳過 ${results.skipped} 個訂單${results.errors > 0 ? `，${results.errors} 個錯誤` : ''}`
    })

  } catch (error) {
    console.error('批量導入錯誤:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '批量導入失敗'
    }, { status: 500 })
  }
}

/**
 * GET /api/recipes/batch-import
 * 獲取可批量導入的訂單統計
 */
export async function GET() {
  try {
    // 統計已完成的訂單數
    const completedOrdersCount = await prisma.productionOrder.count({
      where: {
        completionDate: { not: null }
      }
    })

    // 統計配方庫中的配方數
    const recipesCount = await prisma.recipeLibrary.count({
      where: { isActive: true }
    })

    // 統計配方庫中的總生產次數
    const totalProductions = await prisma.recipeLibrary.aggregate({
      where: { isActive: true },
      _sum: { productionCount: true }
    })

    return NextResponse.json({
      success: true,
      data: {
        completedOrdersCount,
        recipesCount,
        totalProductionCount: totalProductions._sum.productionCount || 0,
        estimatedNewRecipes: Math.max(0, completedOrdersCount - (totalProductions._sum.productionCount || 0))
      }
    })

  } catch (error) {
    console.error('獲取統計錯誤:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '獲取統計失敗'
    }, { status: 500 })
  }
}

