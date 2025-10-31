import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // 驗證請求（可以添加認證）
    const { secret } = await request.json()
    
    // 簡單的認證檢查（在生產環境中應該使用更安全的方法）
    if (secret !== process.env.MIGRATION_SECRET) {
      return NextResponse.json(
        { error: '未授權的遷移請求' },
        { status: 401 }
      )
    }

    // Use singleton Prisma client from @/lib/prisma
    
    try {
      // 檢查表是否存在
      const existingTables = await prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
          'ai_recipes', 'ingredient_prices', 'product_efficacies', 
          'work_orders', 'qc_files', 'product_databases', 'ad_copies'
        )
      `

      const existingTableNames = existingTables.map(t => t.table_name)
      const requiredTables = [
        'ai_recipes', 'ingredient_prices', 'product_efficacies', 
        'work_orders', 'qc_files', 'product_databases', 'ad_copies'
      ]
      
      const missingTables = requiredTables.filter(table => !existingTableNames.includes(table))
      
      if (missingTables.length === 0) {
        return NextResponse.json({
          success: true,
          message: '所有 v2.0 表已存在',
          existingTables: existingTableNames
        })
      }

      // 創建缺失的表
      const migrationResults: string[] = []
      
      for (const tableName of missingTables) {
        try {
          let createTableSQL = ''
          
          switch (tableName) {
            case 'ai_recipes':
              createTableSQL = `
                CREATE TABLE "ai_recipes" (
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
                );
              `
              break
              
            case 'ingredient_prices':
              createTableSQL = `
                CREATE TABLE "ingredient_prices" (
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
                );
              `
              break
              
            case 'work_orders':
              createTableSQL = `
                CREATE TABLE "work_orders" (
                  "id" TEXT NOT NULL,
                  "orderId" TEXT NOT NULL,
                  "orderNumber" TEXT NOT NULL,
                  "productName" TEXT NOT NULL,
                  "batchSize" INTEGER NOT NULL,
                  "productionSteps" TEXT NOT NULL,
                  "qualityControlPoints" TEXT NOT NULL,
                  "riskAssessment" TEXT,
                  "isoCompliant" BOOLEAN NOT NULL DEFAULT true,
                  "isoStandard" TEXT,
                  "status" TEXT NOT NULL DEFAULT 'draft',
                  "approvedBy" TEXT,
                  "approvedAt" TIMESTAMP(3),
                  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  "updatedAt" TIMESTAMP(3) NOT NULL,
                  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
                );
              `
              break
              
            case 'product_databases':
              createTableSQL = `
                CREATE TABLE "product_databases" (
                  "id" TEXT NOT NULL,
                  "productName" TEXT NOT NULL,
                  "category" TEXT,
                  "formula" TEXT NOT NULL,
                  "efficacy" TEXT,
                  "safety" TEXT,
                  "tags" TEXT,
                  "notes" TEXT,
                  "version" TEXT NOT NULL DEFAULT '1.0',
                  "createdBy" TEXT,
                  "isActive" BOOLEAN NOT NULL DEFAULT true,
                  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  "updatedAt" TIMESTAMP(3) NOT NULL,
                  CONSTRAINT "product_databases_pkey" PRIMARY KEY ("id")
                );
              `
              break
          }
          
          if (createTableSQL) {
            await prisma.$executeRawUnsafe(createTableSQL)
            migrationResults.push(`✅ 創建表: ${tableName}`)
          }
          
        } catch (error) {
          migrationResults.push(`❌ 創建表 ${tableName} 失敗: ${error}`)
        }
      }

      return NextResponse.json({
        success: true,
        message: '數據庫遷移完成',
        results: migrationResults,
        createdTables: missingTables.filter(table => 
          migrationResults.some(result => result.includes(`✅ 創建表: ${table}`))
        )
      })

    } catch (innerError) {
      throw innerError
    }
    // Note: Don't disconnect singleton client

  } catch (error) {
    console.error('遷移錯誤:', error)
    return NextResponse.json(
      { error: '數據庫遷移失敗', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: '數據庫遷移端點',
    usage: 'POST /api/migrate with { "secret": "your_migration_secret" }',
    note: '請設置 MIGRATION_SECRET 環境變量'
  })
}