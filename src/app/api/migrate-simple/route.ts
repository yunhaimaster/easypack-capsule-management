import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Use singleton Prisma client from @/lib/prisma
    
    try {
      // 直接執行創建表的 SQL
      const createTablesSQL = `
        -- 創建 ai_recipes 表
        CREATE TABLE IF NOT EXISTS "ai_recipes" (
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

        -- 創建 ingredient_prices 表
        CREATE TABLE IF NOT EXISTS "ingredient_prices" (
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

        -- 創建 work_orders 表
        CREATE TABLE IF NOT EXISTS "work_orders" (
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

        -- 創建 product_databases 表
        CREATE TABLE IF NOT EXISTS "product_databases" (
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

        -- 創建 product_efficacies 表
        CREATE TABLE IF NOT EXISTS "product_efficacies" (
          "id" TEXT NOT NULL,
          "productName" TEXT NOT NULL,
          "ingredients" TEXT NOT NULL,
          "efficacyData" TEXT,
          "clinicalEvidence" TEXT,
          "safetyProfile" TEXT,
          "contraindications" TEXT,
          "interactions" TEXT,
          "dosageRecommendations" TEXT,
          "targetPopulation" TEXT,
          "efficacyScore" DOUBLE PRECISION,
          "safetyScore" DOUBLE PRECISION,
          "evidenceLevel" TEXT,
          "lastReviewed" TIMESTAMP(3),
          "reviewedBy" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "product_efficacies_pkey" PRIMARY KEY ("id")
        );

        -- 創建 qc_files 表
        CREATE TABLE IF NOT EXISTS "qc_files" (
          "id" TEXT NOT NULL,
          "workOrderId" TEXT NOT NULL,
          "fileName" TEXT NOT NULL,
          "fileType" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "isoStandard" TEXT NOT NULL,
          "version" TEXT NOT NULL DEFAULT '1.0',
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "qc_files_pkey" PRIMARY KEY ("id")
        );

        -- 創建 ad_copies 表
        CREATE TABLE IF NOT EXISTS "ad_copies" (
          "id" TEXT NOT NULL,
          "productName" TEXT NOT NULL,
          "targetAudience" TEXT NOT NULL,
          "platform" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "copyType" TEXT NOT NULL DEFAULT 'marketing',
          "tone" TEXT NOT NULL DEFAULT 'professional',
          "complianceStatus" TEXT,
          "regulatoryApproval" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "ad_copies_pkey" PRIMARY KEY ("id")
        );
      `

      // 執行 SQL - 分別執行每個 CREATE TABLE 語句
      const sqlStatements = createTablesSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0)
      
      for (const statement of sqlStatements) {
        if (statement.includes('CREATE TABLE')) {
          try {
            await prisma.$executeRawUnsafe(statement)
          } catch (error) {
            // 如果表已存在，忽略錯誤
            if (error instanceof Error && !error.message.includes('already exists')) {
              console.error(`創建表失敗: ${statement}`, error)
            }
          }
        }
      }

      // 檢查創建的表
      const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
          'ai_recipes', 'ingredient_prices', 'product_efficacies', 
          'work_orders', 'qc_files', 'product_databases', 'ad_copies'
        )
        ORDER BY table_name
      `

      return NextResponse.json({
        success: true,
        message: 'v2.0 表創建成功',
        createdTables: tables.map(t => t.table_name),
        totalTables: tables.length
      })

    } catch (innerError) {
      throw innerError
    }
    // Note: Don't disconnect singleton client

  } catch (error) {
    console.error('遷移錯誤:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '數據庫遷移失敗', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'v2.0 數據庫表創建端點',
    usage: 'POST /api/migrate-simple',
    note: '此端點會創建所有 v2.0 所需的數據庫表'
  })
}
