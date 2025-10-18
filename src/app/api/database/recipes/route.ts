import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''

    const skip = (page - 1) * limit

    // 構建查詢條件
    const where: any = {}
    
    if (search) {
      where.OR = [
        { productName: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (category) {
      where.category = category
    }

    // 嘗試獲取產品數據，如果表不存在則使用空數組
    let products: any[] = []
    let total = 0
    try {
      [products, total] = await Promise.all([
        prisma.productDatabase.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            updatedAt: 'desc'
          }
        }),
        prisma.productDatabase.count({ where })
      ])
    } catch (dbError) {
      console.warn('產品資料庫表不存在，使用空數據:', dbError)
      products = []
      total = 0
    }

    return NextResponse.json({
      success: true,
      products: products.map(product => ({
        id: product.id,
        productName: product.productName,
        category: product.category,
        formula: product.formula,
        efficacy: product.efficacy,
        safety: product.safety,
        regulatoryStatus: product.regulatoryStatus,
        version: product.version,
        isActive: product.isActive,
        tags: product.tags ? JSON.parse(product.tags) : [],
        notes: product.notes,
        createdBy: product.createdBy,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('獲取產品列表錯誤:', error)
    return NextResponse.json(
      { success: false, error: '獲取產品列表失敗' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { productName, category, formula, efficacy, safety, tags, notes } = await request.json()

    if (!productName) {
      return NextResponse.json(
        { success: false, error: '產品名稱不能為空' },
        { status: 400 }
      )
    }

    // 嘗試創建產品，如果表不存在則返回錯誤
    let product: any = null
    try {
      product = await prisma.productDatabase.create({
        data: {
          productName,
          category,
          formula: JSON.stringify(formula || {}),
          efficacy: efficacy ? JSON.stringify(efficacy) : null,
          safety: safety ? JSON.stringify(safety) : null,
          regulatoryStatus: null,
          version: '1.0',
          isActive: true,
          tags: tags ? JSON.stringify(tags) : null,
          notes,
          createdBy: '系統'
        }
      })
    } catch (dbError) {
      console.warn('產品資料庫表不存在:', dbError)
      return NextResponse.json(
        { success: false, error: '數據庫表不存在，請先設置數據庫' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        productName: product.productName,
        category: product.category,
        formula: product.formula,
        efficacy: product.efficacy,
        safety: product.safety,
        regulatoryStatus: product.regulatoryStatus,
        version: product.version,
        isActive: product.isActive,
        tags: product.tags ? JSON.parse(product.tags) : [],
        notes: product.notes,
        createdBy: product.createdBy,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }
    })

  } catch (error) {
    console.error('創建產品錯誤:', error)
    return NextResponse.json(
      { success: false, error: '創建產品失敗' },
      { status: 500 }
    )
  }
}