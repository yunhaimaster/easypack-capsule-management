import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeHongKongDefault } from '@/lib/auth/phone'
import { createSession } from '@/lib/auth/session'
import { logAudit } from '@/lib/audit'
import { AuditAction, Role } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Admin Direct Login (Emergency Bypass)
 * 
 * This endpoint allows existing admin users to login directly
 * using the bootstrap code when OTP is unavailable.
 * 
 * Security:
 * - Only works for existing ADMIN users
 * - Requires ADMIN_BOOTSTRAP_CODE
 * - Full audit logging
 */
export async function POST(request: NextRequest) {
  try {
    const { phone, bootstrapCode } = await request.json()
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const userAgent = request.headers.get('user-agent') || null

    const adminBootstrapCode = process.env.ADMIN_BOOTSTRAP_CODE

    if (!adminBootstrapCode) {
      return NextResponse.json(
        { success: false, error: 'Bootstrap not configured' },
        { status: 503 }
      )
    }

    // Normalize phone number
    let phoneE164: string
    try {
      phoneE164 = normalizeHongKongDefault(String(phone || ''))
    } catch (e) {
      return NextResponse.json(
        { success: false, error: (e as Error).message },
        { status: 400 }
      )
    }

    // Verify bootstrap code
    const receivedCode = String(bootstrapCode || '').trim()
    const expectedCode = adminBootstrapCode.trim()
    
    if (!timingSafeEqual(receivedCode, expectedCode)) {
      await logAudit({
        action: AuditAction.OTP_VERIFY_FAIL,
        phone: phoneE164,
        ip,
        userAgent,
        metadata: { reason: 'Invalid direct login code' }
      })
      return NextResponse.json(
        { success: false, error: '啟動碼錯誤' },
        { status: 401 }
      )
    }

    // Check if user exists and is admin
    const user = await prisma.user.findUnique({
      where: { phoneE164 }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用戶不存在' },
        { status: 404 }
      )
    }

    if (user.role !== Role.ADMIN) {
      await logAudit({
        action: AuditAction.OTP_VERIFY_FAIL,
        userId: user.id,
        phone: phoneE164,
        ip,
        userAgent,
        metadata: { reason: 'Direct login only for admins' }
      })
      return NextResponse.json(
        { success: false, error: '此功能僅適用於管理員' },
        { status: 403 }
      )
    }

    // Create session (admin direct login always gets 30-day session)
    const session = await createSession(user.id, { ip, userAgent, trustDevice: true })

    await logAudit({
      action: AuditAction.LOGIN_SUCCESS,
      userId: user.id,
      phone: phoneE164,
      ip,
      userAgent,
      metadata: { method: 'admin_direct_login' }
    })

    console.log('[Admin Direct Login] Admin logged in:', phoneE164)

    const response = NextResponse.json({
      success: true,
      data: { role: user.role }
    })

    response.cookies.set(session.cookieName, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: session.expiresAt,
    })

    return response

  } catch (error) {
    console.error('[Admin Direct Login] Error:', error)
    return NextResponse.json(
      { success: false, error: '登入失敗' },
      { status: 500 }
    )
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

