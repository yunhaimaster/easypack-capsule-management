import { NextRequest, NextResponse } from 'next/server'

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { success: false, error: '請輸入登入碼' },
        { status: 400 }
      )
    }

    const NORMAL_PASSWORD = (process.env.LOGIN || '2356').trim()
    const ADMIN_PASSWORD = (process.env.ADMIN_LOGIN || '1234').trim()

    const isAdmin = timingSafeEqual(password.trim(), ADMIN_PASSWORD)
    const isNormal = timingSafeEqual(password.trim(), NORMAL_PASSWORD)

    if (isAdmin) {
      return NextResponse.json({ 
        success: true, 
        role: 'admin'  // 返回角色標記
      })
    }

    if (isNormal) {
      return NextResponse.json({ 
        success: true, 
        role: 'user' 
      })
    }

    return NextResponse.json(
      { success: false, error: '登入碼錯誤' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: '登入時發生錯誤，請稍後再試' },
      { status: 500 }
    )
  }
}
