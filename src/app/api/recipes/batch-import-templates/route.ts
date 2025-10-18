import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateRecipeFingerprint } from '@/lib/recipe-fingerprint'
import type { RecipeIngredient } from '@/types'

interface TemplateRecipeInput {
  recipeName: string
  description?: string
  ingredients: RecipeIngredient[]
  capsuleSize?: string
  capsuleColor?: string
  capsuleType?: string
  notes?: string
}

interface ImportDetail {
  recipeName: string
  status: 'success' | 'failed' | 'duplicate'
  message?: string
  recipeId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipes } = body as { recipes: TemplateRecipeInput[] }

    if (!recipes || !Array.isArray(recipes) || recipes.length === 0) {
      return NextResponse.json(
        { success: false, error: '請提供至少一個配方' },
        { status: 400 }
      )
    }

    let imported = 0
    let failed = 0
    let duplicate = 0
    const details: ImportDetail[] = []

    for (const recipeInput of recipes) {
      try {
        // 驗證必填字段
        if (!recipeInput.recipeName || !recipeInput.recipeName.trim()) {
          details.push({
            recipeName: recipeInput.recipeName || '未命名',
            status: 'failed',
            message: '配方名稱不能為空'
          })
          failed++
          continue
        }

        if (!recipeInput.ingredients || recipeInput.ingredients.length === 0) {
          details.push({
            recipeName: recipeInput.recipeName,
            status: 'failed',
            message: '配方必須包含至少一種原料'
          })
          failed++
          continue
        }

        // 計算單粒總重量
        const unitWeightMg = recipeInput.ingredients.reduce(
          (sum, ing) => sum + ing.unitContentMg,
          0
        )

        if (unitWeightMg <= 0) {
          details.push({
            recipeName: recipeInput.recipeName,
            status: 'failed',
            message: '原料含量總和必須大於 0'
          })
          failed++
          continue
        }

        // 生成配方指紋（用於去重）
        // 對於模板配方，我們使用配方名稱 + 原料組合作為指紋
        const fingerprint = generateRecipeFingerprint(
          recipeInput.recipeName, // 使用配方名稱代替客戶名稱
          recipeInput.recipeName, // 使用配方名稱代替產品名稱
          recipeInput.ingredients
        )

        // 檢查是否已存在相同指紋的配方
        const existingRecipe = await prisma.recipeLibrary.findUnique({
          where: { recipeFingerprint: fingerprint }
        })

        if (existingRecipe) {
          details.push({
            recipeName: recipeInput.recipeName,
            status: 'duplicate',
            message: '配方已存在',
            recipeId: existingRecipe.id
          })
          duplicate++
          continue
        }

        // 創建模板配方
        const recipe = await prisma.recipeLibrary.create({
          data: {
            recipeName: recipeInput.recipeName.trim(),
            description: recipeInput.description?.trim() || null,
            customerName: '模板配方', // 模板配方使用固定的客戶名稱
            productName: recipeInput.recipeName.trim(),
            sourceOrderIds: JSON.stringify([]), // 模板配方沒有來源訂單
            ingredients: JSON.stringify(recipeInput.ingredients),
            unitWeightMg,
            recipeFingerprint: fingerprint,
            capsuleColor: recipeInput.capsuleColor?.trim() || null,
            capsuleSize: recipeInput.capsuleSize?.trim() || null,
            capsuleType: recipeInput.capsuleType?.trim() || null,
            notes: recipeInput.notes?.trim() || null,
            productionCount: 0, // 模板配方初始生產次數為 0
            usageCount: 0,
            lastProductionAt: null,
            lastUsedAt: null,
            recipeType: 'template', // 🆕 標記為模板配方
            sourceType: 'batch_import', // 🆕 標記為批量導入
            isActive: true,
            createdBy: null
          }
        })

        details.push({
          recipeName: recipeInput.recipeName,
          status: 'success',
          message: '導入成功',
          recipeId: recipe.id
        })
        imported++

      } catch (error) {
        console.error(`Failed to import recipe ${recipeInput.recipeName}:`, error)
        details.push({
          recipeName: recipeInput.recipeName,
          status: 'failed',
          message: error instanceof Error ? error.message : '導入失敗'
        })
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        imported,
        failed,
        duplicate,
        total: recipes.length,
        details
      },
      message: `成功導入 ${imported} 個配方${duplicate > 0 ? `，${duplicate} 個重複` : ''}${failed > 0 ? `，${failed} 個失敗` : ''}`
    })

  } catch (error) {
    console.error('Batch import templates error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '批量導入失敗'
      },
      { status: 500 }
    )
  }
}

// GET: 獲取導入統計（預估可導入的配方數）
export async function GET() {
  try {
    // 統計現有模板配方數量
    const templateCount = await prisma.recipeLibrary.count({
      where: { recipeType: 'template' }
    })

    return NextResponse.json({
      success: true,
      data: {
        existingTemplates: templateCount,
        message: `當前有 ${templateCount} 個模板配方`
      }
    })

  } catch (error) {
    console.error('Get import stats error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '獲取統計失敗'
      },
      { status: 500 }
    )
  }
}

