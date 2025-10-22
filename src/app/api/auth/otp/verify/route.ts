import { NextRequest, NextResponse } from 'next/server'
import { getTwilio, getVerifyServiceSid } from '@/lib/twilio'
import { normalizeHongKongDefault } from '@/lib/auth/phone'
import { logAudit } from '@/lib/audit'
import { AuditAction, Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth/session'
import { createTrustedDevice, generateDeviceId } from '@/lib/auth/device'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { phone, code, trustDevice } = await request.json()
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const userAgent = request.headers.get('user-agent') || null

    const phoneE164 = normalizeHongKongDefault(String(phone || ''))

    const client = getTwilio()
    const serviceSid = getVerifyServiceSid()
    const check = await client.verify.v2.services(serviceSid).verificationChecks.create({ to: phoneE164, code: String(code || '') })
    if (check.status !== 'approved') {
      await logAudit({ action: AuditAction.OTP_VERIFY_FAIL, phone: phoneE164, ip, userAgent })
      return NextResponse.json({ success: false, error: '驗證碼錯誤' }, { status: 401 })
    }

    // Upsert user
    const adminPhone = (process.env.ADMIN_BOOTSTRAP_PHONE || '').trim()
    const user = await prisma.user.upsert({
      where: { phoneE164 },
      create: { phoneE164, role: adminPhone && adminPhone === phoneE164 ? Role.ADMIN : Role.EMPLOYEE },
      update: {},
    })

    // Create session with appropriate duration
    const session = await createSession(user.id, { 
      ip, 
      userAgent, 
      trustDevice: Boolean(trustDevice)  // 傳遞信任裝置標記
    })

    // Optional device trust
    if (trustDevice) {
      const deviceId = generateDeviceId()
      await createTrustedDevice(user.id, deviceId, { ip, userAgent })
    }

    await logAudit({ action: AuditAction.OTP_VERIFY_SUCCESS, userId: user.id, phone: phoneE164, ip, userAgent })
    await logAudit({ action: AuditAction.LOGIN_SUCCESS, userId: user.id, phone: phoneE164, ip, userAgent })

    // Return JSON response with cookie (frontend will handle redirect)
    const response = NextResponse.json({ success: true, data: { role: user.role } })
    
    // Set session cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      expires: session.expiresAt,
    }
    
    console.log('[OTP Verify] Setting cookie:', {
      name: session.cookieName,
      options: cookieOptions,
      expires: session.expiresAt.toISOString(),
    })
    
    response.cookies.set(session.cookieName, session.token, cookieOptions)

    return response
  } catch (error) {
    console.error('OTP verify error', error)
    return NextResponse.json({ success: false, error: '驗證失敗' }, { status: 500 })
  }
}


