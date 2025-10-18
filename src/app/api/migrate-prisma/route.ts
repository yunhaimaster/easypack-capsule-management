import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function POST() {
  try {
    const prisma = new PrismaClient()
    
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

      // 使用 Prisma 創建表
      const results: string[] = []
      
      for (const tableName of missingTables) {
        try {
          let createSQL = ''
          
          switch (tableName) {
            case 'ai_recipes':
              createSQL = `CREATE TABLE "ai_recipes" (
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
              )`
              break
              
            case 'ingredient_prices':
              createSQL = `CREATE TABLE "ingredient_prices" (
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
              )`
              break
              
            case 'work_orders':
              createSQL = `CREATE TABLE "work_orders" (
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
              )`
              break
              
            case 'product_databases':
              createSQL = `CREATE TABLE "product_databases" (
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
              )`
              break
              
            case 'product_efficacies':
              createSQL = `CREATE TABLE "product_efficacies" (
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
              )`
              break
              
            case 'qc_files':
              createSQL = `CREATE TABLE "qc_files" (
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
              )`
              break
              
            case 'ad_copies':
              createSQL = `CREATE TABLE "ad_copies" (
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
              )`
              break
          }
          
          if (createSQL) {
            await prisma.$executeRawUnsafe(createSQL)
            results.push(`✅ 創建表: ${tableName}`)
          }
          
        } catch (error) {
          results.push(`❌ 創建表 ${tableName} 失敗: ${error instanceof Error ? error.message : String(error)}`)
        }
      }

      // 重新檢查表
      const finalTables = await prisma.$queryRaw<Array<{ table_name: string }>>`
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
        message: 'v2.0 表創建完成',
        results,
        createdTables: finalTables.map(t => t.table_name),
        totalTables: finalTables.length
      })

    } finally {
      await prisma.$disconnect()
    }

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
    message: 'v2.0 數據庫表創建端點 (Prisma 版本)',
    usage: 'POST /api/migrate-prisma',
    note: '此端點使用 Prisma 原生方法創建 v2.0 所需的數據庫表'
  })
}
