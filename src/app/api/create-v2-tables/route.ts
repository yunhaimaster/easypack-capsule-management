import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    logger.info('開始創建 v2.0 數據庫表')

    // 創建 v2.0 表的 SQL 語句（分開執行）
    const createTablesSQL = [
      // 創建 AI 配方表
      `CREATE TABLE IF NOT EXISTS "ai_recipes" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "targetEffect" TEXT NOT NULL,
        "targetAudience" TEXT,
        "dosageForm" TEXT NOT NULL DEFAULT 'capsule',
        "ingredients" TEXT NOT NULL,
        "dosage" TEXT NOT NULL,
        "efficacyScore" DOUBLE PRECISION,
        "safetyScore" DOUBLE PRECISION,
        "costAnalysis" TEXT,
        "regulatoryStatus" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "ai_recipes_pkey" PRIMARY KEY ("id")
      )`,
      
      // 創建原料價格表
      `CREATE TABLE IF NOT EXISTS "ingredient_prices" (
        "id" TEXT NOT NULL,
        "materialName" TEXT NOT NULL,
        "supplier" TEXT NOT NULL,
        "price" DOUBLE PRECISION NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'HKD',
        "unit" TEXT NOT NULL DEFAULT 'kg',
        "minimumOrder" DOUBLE PRECISION,
        "leadTime" TEXT,
        "quality" TEXT NOT NULL DEFAULT 'A',
        "source" TEXT,
        "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "validTo" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "ingredient_prices_pkey" PRIMARY KEY ("id")
      )`,
      
      // 創建產品功效表
      `CREATE TABLE IF NOT EXISTS "product_efficacy" (
        "id" TEXT NOT NULL,
        "ingredientName" TEXT NOT NULL,
        "effect" TEXT NOT NULL,
        "evidenceLevel" TEXT NOT NULL,
        "dosage" DOUBLE PRECISION NOT NULL,
        "scientificBasis" TEXT,
        "clinicalTrials" TEXT,
        "safetyProfile" TEXT,
        "interactions" TEXT,
        "contraindications" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "product_efficacy_pkey" PRIMARY KEY ("id")
      )`,
      
      // 創建工作單表
      `CREATE TABLE IF NOT EXISTS "work_orders" (
        "id" TEXT NOT NULL,
        "orderId" TEXT NOT NULL,
        "orderNumber" TEXT NOT NULL,
        "productName" TEXT NOT NULL,
        "batchSize" INTEGER NOT NULL,
        "productionSteps" TEXT NOT NULL,
        "qualityControlPoints" TEXT NOT NULL,
        "riskAssessment" TEXT,
        "isoCompliant" BOOLEAN NOT NULL DEFAULT true,
        "isoStandard" TEXT NOT NULL DEFAULT 'ISO 9001',
        "status" TEXT NOT NULL DEFAULT 'draft',
        "approvedBy" TEXT,
        "approvedAt" TIMESTAMP(3),
        "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
      )`,
      
      // 創建 QC 文件表
      `CREATE TABLE IF NOT EXISTS "qc_files" (
        "id" TEXT NOT NULL,
        "workOrderId" TEXT NOT NULL,
        "testMethods" TEXT NOT NULL,
        "acceptanceCriteria" TEXT NOT NULL,
        "inspectionRecords" TEXT,
        "isoStandard" TEXT NOT NULL DEFAULT 'ISO 9001',
        "testResults" TEXT,
        "inspector" TEXT,
        "inspectedAt" TIMESTAMP(3),
        "status" TEXT NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "qc_files_pkey" PRIMARY KEY ("id")
      )`,
      
      // 創建產品資料庫表
      `CREATE TABLE IF NOT EXISTS "product_database" (
        "id" TEXT NOT NULL,
        "productName" TEXT NOT NULL,
        "category" TEXT,
        "formula" TEXT NOT NULL,
        "efficacy" TEXT,
        "safety" TEXT,
        "regulatoryStatus" TEXT,
        "version" TEXT NOT NULL DEFAULT '1.0',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "tags" TEXT,
        "notes" TEXT,
        "createdBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "product_database_pkey" PRIMARY KEY ("id")
      )`,
      
      // 創建廣告詞表
      `CREATE TABLE IF NOT EXISTS "ad_copies" (
        "id" TEXT NOT NULL,
        "productId" TEXT,
        "targetMarket" TEXT NOT NULL,
        "language" TEXT NOT NULL DEFAULT 'zh-TW',
        "copyType" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "regulatoryCompliant" BOOLEAN NOT NULL DEFAULT false,
        "evidenceBased" BOOLEAN NOT NULL DEFAULT false,
        "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
        "version" TEXT NOT NULL DEFAULT '1.0',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "ad_copies_pkey" PRIMARY KEY ("id")
      )`
    ]

    // 分別執行每個 SQL 語句
    const createdTables = []
    for (const sql of createTablesSQL) {
      try {
        await prisma.$executeRawUnsafe(sql)
        // 從SQL中提取表名
        const tableName = sql.match(/CREATE TABLE IF NOT EXISTS "(\w+)"/)?.[1]
        if (tableName) {
          createdTables.push(tableName)
        }
      } catch (error) {
        logger.warn('創建表失敗', {
          table: sql.match(/CREATE TABLE IF NOT EXISTS "(\w+)"/)?.[1],
          error: error instanceof Error ? error.message : String(error)
        })
        // 繼續執行其他表的創建
      }
    }

    logger.info('v2.0 表創建完成', {
      tablesCreated: createdTables,
      tableCount: createdTables.length
    })

    return NextResponse.json({
      success: true,
      message: `成功創建 ${createdTables.length} 個 v2.0 數據庫表`,
      tables: createdTables,
      count: createdTables.length,
      generatedAt: new Date().toISOString(),
    })

  } catch (error) {
    logger.error('創建 v2.0 表錯誤', {
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json(
      { 
        success: false, 
        error: '創建 v2.0 表失敗',
        details: error instanceof Error ? error.message : '未知錯誤'
      },
      { status: 500 }
    )
  }
}
