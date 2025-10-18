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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { success: false, error: '請輸入密碼' },
        { status: 400 }
      )
    }

    const order = await prisma.productionOrder.findUnique({
      where: { id },
      select: { lockPassword: true }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: '訂單不存在' },
        { status: 404 }
      )
    }

    if (!order.lockPassword) {
      return NextResponse.json(
        { success: false, error: '此訂單未設定密碼鎖' },
        { status: 400 }
      )
    }

    const isValid = timingSafeEqual(password.trim(), order.lockPassword.trim())

    if (isValid) {
      logger.info('密碼驗證成功', { orderId: id })
      return NextResponse.json({ success: true, valid: true })
    } else {
      logger.warn('密碼驗證失敗', { orderId: id })
      return NextResponse.json({ success: true, valid: false })
    }
  } catch (error) {
    logger.error('密碼驗證錯誤', {
      error: error instanceof Error ? error.message : String(error),
      orderId: id
    })
    return NextResponse.json(
      { success: false, error: '密碼驗證失敗' },
      { status: 500 }
    )
  }
}
