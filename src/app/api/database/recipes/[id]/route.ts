import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await prisma.productDatabase.findUnique({
      where: { id }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: '找不到指定的產品' },
        { status: 404 }
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
    console.error('獲取產品詳情錯誤:', error)
    return NextResponse.json(
      { success: false, error: '獲取產品詳情失敗' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { productName, category, formula, efficacy, safety, tags, notes, isActive } = await request.json()

    const product = await prisma.productDatabase.update({
      where: { id },
      data: {
        productName,
        category,
        formula: formula ? JSON.stringify(formula) : undefined,
        efficacy: efficacy ? JSON.stringify(efficacy) : undefined,
        safety: safety ? JSON.stringify(safety) : undefined,
        tags: tags ? JSON.stringify(tags) : undefined,
        notes,
        isActive,
        updatedAt: new Date()
      }
    })

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
    console.error('更新產品錯誤:', error)
    return NextResponse.json(
      { success: false, error: '更新產品失敗' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.productDatabase.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: '產品已成功刪除'
    })

  } catch (error) {
    console.error('刪除產品錯誤:', error)
    return NextResponse.json(
      { success: false, error: '刪除產品失敗' },
      { status: 500 }
    )
  }
}
