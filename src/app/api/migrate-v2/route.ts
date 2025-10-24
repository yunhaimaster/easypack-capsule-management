import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    logger.info('開始 v2.0 數據庫遷移')

    // 檢查並創建 v2.0 表
    const migrations = []

    // 1. 檢查 AIRecipe 表
    try {
      await prisma.aIRecipe.findFirst()
      logger.info('AIRecipe 表已存在')
    } catch (error) {
      logger.info('AIRecipe 表不存在，需要創建')
      migrations.push('AIRecipe 表')
    }

    // 2. 檢查 IngredientPrice 表
    try {
      await prisma.ingredientPrice.findFirst()
      logger.info('IngredientPrice 表已存在')
    } catch (error) {
      logger.info('IngredientPrice 表不存在，需要創建')
      migrations.push('IngredientPrice 表')
    }

    // 3. 檢查 ProductEfficacy 表
    try {
      await prisma.productEfficacy.findFirst()
      logger.info('ProductEfficacy 表已存在')
    } catch (error) {
      logger.info('ProductEfficacy 表不存在，需要創建')
      migrations.push('ProductEfficacy 表')
    }

    // 4. 檢查 LegacyWorkOrder 表 (舊的 WorkOrder 模型已重命名)
    try {
      await prisma.legacyWorkOrder.findFirst()
      logger.info('LegacyWorkOrder 表已存在')
    } catch (error) {
      logger.info('LegacyWorkOrder 表不存在，需要創建')
      migrations.push('LegacyWorkOrder 表')
    }

    // 5. 檢查 QCFile 表
    try {
      await prisma.qCFile.findFirst()
      logger.info('QCFile 表已存在')
    } catch (error) {
      logger.info('QCFile 表不存在，需要創建')
      migrations.push('QCFile 表')
    }

    // 6. 檢查 ProductDatabase 表
    try {
      await prisma.productDatabase.findFirst()
      logger.info('ProductDatabase 表已存在')
    } catch (error) {
      logger.info('ProductDatabase 表不存在，需要創建')
      migrations.push('ProductDatabase 表')
    }

    // 7. 檢查 AdCopy 表
    try {
      await prisma.adCopy.findFirst()
      logger.info('AdCopy 表已存在')
    } catch (error) {
      logger.info('AdCopy 表不存在，需要創建')
      migrations.push('AdCopy 表')
    }

    if (migrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'v2.0 數據庫遷移完成 - 所有表已存在',
        migrations: []
      })
    }

    return NextResponse.json({
      success: true,
      message: `v2.0 數據庫遷移完成 - 需要創建 ${migrations.length} 個表`,
      migrations,
      note: '請運行 "npx prisma migrate dev" 來創建缺失的表'
    })

  } catch (error) {
    logger.error('v2.0 數據庫遷移錯誤', {
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json(
      { 
        success: false, 
        error: 'v2.0 數據庫遷移失敗',
        details: error instanceof Error ? error.message : '未知錯誤'
      },
      { status: 500 }
    )
  }
}
