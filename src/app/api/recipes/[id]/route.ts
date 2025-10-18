import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { RecipeLibraryItem, UpdateRecipeData } from '@/types'
import { z } from 'zod'

// Zod Schema for editing recipe fields - 包含原料清單
const editRecipeSchema = z.object({
  recipeName: z.string().trim().min(1, '配方名稱不能為空').max(200, '配方名稱過長').optional(),
  productName: z.string().trim().min(1, '產品名稱不能為空').max(200, '產品名稱過長').optional(),
  description: z.string().optional().nullable(),
  capsuleSize: z.string().optional().nullable(),
  capsuleColor: z.string().optional().nullable(),
  capsuleType: z.string().optional().nullable(),
  // 🆕 原料清單
  ingredients: z.array(z.object({
    materialName: z.string().trim().min(1, '原料名稱不能為空'),
    unitContentMg: z.number().positive('含量必須大於 0')
  })).min(1, '至少需要一個原料').optional()
})

/**
 * GET /api/recipes/[id]
 * 獲取單個配方的詳細資訊
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const recipe = await prisma.recipeLibrary.findUnique({
      where: { id }
    })

    if (!recipe) {
      return NextResponse.json({
        success: false,
        error: '配方不存在'
      }, { status: 404 })
    }

    // 轉換資料格式
    const formattedRecipe: RecipeLibraryItem = {
      ...recipe,
      sourceOrderIds: JSON.parse(recipe.sourceOrderIds) as string[],
      ingredients: JSON.parse(recipe.ingredients),
      tags: recipe.tags ? JSON.parse(recipe.tags) as string[] : [],
      recipeType: recipe.recipeType as 'production' | 'template', // 🆕 類型轉換
      sourceType: recipe.sourceType as 'order' | 'manual' | 'batch_import' // 🆕 類型轉換
    }

    return NextResponse.json({
      success: true,
      data: formattedRecipe
    })

  } catch (error) {
    console.error('獲取配方詳情錯誤:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '獲取配方詳情失敗'
    }, { status: 500 })
  }
}

/**
 * PUT /api/recipes/[id]
 * 更新配方資訊
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json() as UpdateRecipeData

    // 檢查配方是否存在
    const existingRecipe = await prisma.recipeLibrary.findUnique({
      where: { id }
    })

    if (!existingRecipe) {
      return NextResponse.json({
        success: false,
        error: '配方不存在'
      }, { status: 404 })
    }

    // 🆕 权限验证：只有模板配方可以编辑
    if (existingRecipe.recipeType !== 'template') {
      return NextResponse.json({
        success: false,
        error: '只有模板配方可以编辑',
        code: 'FORBIDDEN_EDIT_PRODUCTION_RECIPE'
      }, { status: 403 })
    }

    // 🆕 验证输入数据
    const validationResult = editRecipeSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: '数据验证失败',
        details: validationResult.error.flatten()
      }, { status: 400 })
    }

    // 🆕 字段白名单：只允许编辑这些字段
    const allowedFields = [
      'recipeName',
      'productName',
      'description',
      'capsuleSize',
      'capsuleColor',
      'capsuleType',
      'ingredients' // 🆕 允許編輯原料清單
    ]

    // 構建更新資料（只包含白名单字段）
    const updateData: any = {}

    for (const field of allowedFields) {
      if (body[field as keyof UpdateRecipeData] !== undefined) {
        let value = body[field as keyof UpdateRecipeData]
        // 將 "none" 轉換為 null
        if (value === 'none') {
          value = null
        }
        // 🆕 特殊處理：ingredients 需要 JSON 序列化
        if (field === 'ingredients' && Array.isArray(value)) {
          updateData[field] = JSON.stringify(value)
        } else {
          updateData[field] = value
        }
      }
    }

    // 🆕 记录编辑历史
    const changes: string[] = []
    const fieldLabels: Record<string, string> = {
      recipeName: '配方名称',
      productName: '产品名称',
      description: '配方描述',
      capsuleSize: '膠囊大小',
      capsuleColor: '膠囊颜色',
      capsuleType: '膠囊类型',
      ingredients: '原料清單' // 🆕 添加原料清單追蹤
    }

    for (const [field, label] of Object.entries(fieldLabels)) {
      if (updateData[field] !== undefined && updateData[field] !== (existingRecipe as any)[field]) {
        // 🆕 特殊處理原料清單的顯示
        if (field === 'ingredients') {
          const oldIngredients = JSON.parse(existingRecipe.ingredients as string)
          const newIngredients = JSON.parse(updateData[field] as string)
          changes.push(`${label}：已更新（${oldIngredients.length} → ${newIngredients.length} 個原料）`)
        } else {
          const oldValue = (existingRecipe as any)[field] || '（空）'
          const newValue = updateData[field] || '（空）'
          changes.push(`${label}：${oldValue} → ${newValue}`)
        }
      }
    }

    if (changes.length > 0) {
      const timestamp = new Date().toLocaleString('zh-HK', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      
      const editLog = `\n\n---\n[编辑记录] ${timestamp}\n${changes.join('\n')}`
      updateData.notes = (existingRecipe.notes || '') + editLog
    }

    // 确保 updatedAt 更新
    updateData.updatedAt = new Date()

    // 更新配方
    const updated = await prisma.recipeLibrary.update({
      where: { id },
      data: updateData
    })

    // 轉換資料格式
    const formattedRecipe: RecipeLibraryItem = {
      ...updated,
      sourceOrderIds: JSON.parse(updated.sourceOrderIds) as string[],
      ingredients: JSON.parse(updated.ingredients),
      tags: updated.tags ? JSON.parse(updated.tags) as string[] : [],
      recipeType: updated.recipeType as 'production' | 'template', // 🆕 類型轉換
      sourceType: updated.sourceType as 'order' | 'manual' | 'batch_import' // 🆕 類型轉換
    }

    return NextResponse.json({
      success: true,
      data: formattedRecipe,
      message: '配方已更新'
    })

  } catch (error) {
    console.error('更新配方錯誤:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '更新配方失敗'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/recipes/[id]
 * 軟刪除配方（設置 isActive = false）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // 檢查配方是否存在
    const existingRecipe = await prisma.recipeLibrary.findUnique({
      where: { id }
    })

    if (!existingRecipe) {
      return NextResponse.json({
        success: false,
        error: '配方不存在'
      }, { status: 404 })
    }

    // 軟刪除（設置 isActive = false）
    await prisma.recipeLibrary.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: '配方已刪除'
    })

  } catch (error) {
    console.error('刪除配方錯誤:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '刪除配方失敗'
    }, { status: 500 })
  }
}

