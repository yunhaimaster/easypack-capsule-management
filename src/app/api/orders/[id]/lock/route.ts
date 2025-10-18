import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Timing-safe comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

// POST - 設定/修改密碼
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { success: false, error: '請輸入密碼' },
        { status: 400 }
      )
    }

    // 驗證：4 位數字
    if (!/^\d{4}$/.test(password)) {
      return NextResponse.json(
        { success: false, error: '密碼必須是 4 位數字' },
        { status: 400 }
      )
    }

    await prisma.productionOrder.update({
      where: { id: params.id },
      data: { lockPassword: password }
    })

    logger.info('訂單密碼鎖設定成功', { orderId: params.id })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('設定密碼鎖錯誤', {
      error: error instanceof Error ? error.message : String(error),
      orderId: params.id
    })
    return NextResponse.json(
      { success: false, error: '設定密碼鎖失敗' },
      { status: 500 }
    )
  }
}

// DELETE - 移除密碼
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.productionOrder.update({
      where: { id: params.id },
      data: { lockPassword: null }
    })

    logger.info('訂單密碼鎖移除成功', { orderId: params.id })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('移除密碼鎖錯誤', {
      error: error instanceof Error ? error.message : String(error),
      orderId: params.id
    })
    return NextResponse.json(
      { success: false, error: '移除密碼鎖失敗' },
      { status: 500 }
    )
  }
}
