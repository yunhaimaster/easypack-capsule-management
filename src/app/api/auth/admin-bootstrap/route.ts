import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeHongKongDefault } from '@/lib/auth/phone'
import { createSession } from '@/lib/auth/session'
import { logAudit } from '@/lib/audit'
import { AuditAction, Role } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Admin Bootstrap Endpoint
 * 
 * This endpoint allows the initial admin to bypass SMS verification
 * using a secure bootstrap code from environment variables.
 * 
 * Usage:
 * 1. Set ADMIN_BOOTSTRAP_PHONE and ADMIN_BOOTSTRAP_CODE in .env
 * 2. POST { phone: "66244432", bootstrapCode: "your-secret-code" }
 * 3. Creates admin user and session without SMS
 * 
 * Security:
 * - Only works for the phone number in ADMIN_BOOTSTRAP_PHONE
 * - Only works if user doesn't exist yet OR user has EMPLOYEE role
 * - Requires exact match of ADMIN_BOOTSTRAP_CODE
 * - After first admin is created, use regular OTP flow
 */
export async function POST(request: NextRequest) {
  try {
    const { phone, bootstrapCode } = await request.json()
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const userAgent = request.headers.get('user-agent') || null

    // Get bootstrap configuration from environment
    const adminBootstrapPhone = process.env.ADMIN_BOOTSTRAP_PHONE
    const adminBootstrapCode = process.env.ADMIN_BOOTSTRAP_CODE

    if (!adminBootstrapPhone || !adminBootstrapCode) {
      return NextResponse.json(
        { success: false, error: 'Admin bootstrap not configured' },
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

    // Verify this is the bootstrap phone number
    const expectedPhoneE164 = normalizeHongKongDefault(adminBootstrapPhone)
    if (phoneE164 !== expectedPhoneE164) {
      await logAudit({
        action: AuditAction.OTP_VERIFY_FAIL,
        phone: phoneE164,
        ip,
        userAgent,
        metadata: { reason: 'Not bootstrap phone' }
      })
      return NextResponse.json(
        { success: false, error: '此功能僅適用於管理員帳號' },
        { status: 403 }
      )
    }

    // Verify bootstrap code (timing-safe comparison)
    const receivedCode = String(bootstrapCode || '').trim()
    const expectedCode = adminBootstrapCode.trim()
    
    console.log('[Admin Bootstrap] Code comparison:', {
      receivedLength: receivedCode.length,
      expectedLength: expectedCode.length,
      receivedFirst3: receivedCode.substring(0, 3),
      expectedFirst3: expectedCode.substring(0, 3),
      match: receivedCode === expectedCode
    })
    
    if (!timingSafeEqual(receivedCode, expectedCode)) {
      await logAudit({
        action: AuditAction.OTP_VERIFY_FAIL,
        phone: phoneE164,
        ip,
        userAgent,
        metadata: { reason: 'Invalid bootstrap code' }
      })
      return NextResponse.json(
        { success: false, error: '啟動碼錯誤' },
        { status: 401 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { phoneE164 }
    })

    // Only allow bootstrap if:
    // 1. User doesn't exist yet, OR
    // 2. User exists but is not already an admin
    if (existingUser && existingUser.role === Role.ADMIN) {
      return NextResponse.json(
        { success: false, error: '管理員帳號已存在，請使用一般登入' },
        { status: 400 }
      )
    }

    // Create or upgrade user to admin
    const user = await prisma.user.upsert({
      where: { phoneE164 },
      create: {
        phoneE164,
        role: Role.ADMIN
      },
      update: {
        role: Role.ADMIN
      }
    })

    // Create session (admin bootstrap always gets 30-day session)
    const session = await createSession(user.id, { ip, userAgent, trustDevice: true })

    await logAudit({
      action: AuditAction.LOGIN_SUCCESS,
      userId: user.id,
      phone: phoneE164,
      ip,
      userAgent,
      metadata: { method: 'admin_bootstrap' }
    })

    console.log('[Admin Bootstrap] Admin user created/upgraded:', phoneE164)

    // Return session cookie
    const response = NextResponse.json({
      success: true,
      data: { role: user.role, message: '管理員帳號已創建' }
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
    console.error('[Admin Bootstrap] Error:', error)
    return NextResponse.json(
      { success: false, error: '啟動失敗，請稍後再試' },
      { status: 500 }
    )
  }
}

// Timing-safe string comparison to prevent timing attacks
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

