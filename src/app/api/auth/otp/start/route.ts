import { NextRequest, NextResponse } from 'next/server'
import { getTwilio, getVerifyServiceSid } from '@/lib/twilio'
import { normalizeHongKongDefault, phoneInputSchema } from '@/lib/auth/phone'
import { countRecentAttemptsByIp, countRecentAttemptsByPhone, recordOtpAttempt } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  let phoneE164: string | undefined // Declare at function scope for error logging
  
  try {
    const { phone } = await request.json()
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const userAgent = request.headers.get('user-agent') || null

    const parsed = phoneInputSchema.safeParse(phone)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: '請輸入有效電話號碼' }, { status: 400 })
    }

    try {
      phoneE164 = normalizeHongKongDefault(parsed.data)
    } catch (e) {
      return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 })
    }

    // Basic rate limits
    const phoneCount = await countRecentAttemptsByPhone(phoneE164, 60_000)
    if (phoneCount >= 3) {
      return NextResponse.json({ success: false, error: '請稍後再試（頻率限制）' }, { status: 429 })
    }
    if (ip) {
      const ipCount = await countRecentAttemptsByIp(ip, 60_000)
      if (ipCount >= 10) {
        return NextResponse.json({ success: false, error: '請稍後再試（頻率限制）' }, { status: 429 })
      }
    }

    // Check if user exists before sending OTP
    const existingUser = await prisma.user.findUnique({
      where: { phoneE164 }
    })

    if (!existingUser) {
      // Log failed login attempt
      await logAudit({ 
        action: AuditAction.LOGIN_FAILED, 
        phone: phoneE164, 
        ip, 
        userAgent,
        metadata: {
          reason: 'USER_NOT_FOUND',
          phoneE164
        }
      })
      
      return NextResponse.json({ 
        success: false, 
        error: '此電話號碼尚未註冊，請聯繫管理員' 
      }, { status: 404 })
    }

    const client = getTwilio()
    const serviceSid = getVerifyServiceSid()

    // Security: Don't log phone numbers - removed console.log

    await client.verify.v2.services(serviceSid).verifications.create({ 
      to: phoneE164, 
      channel: 'sms',
      locale: 'zh-HK' // Traditional Chinese (Hong Kong)
    })

    // Security: Don't log phone numbers - removed console.log

    await recordOtpAttempt(phoneE164, ip)
    await logAudit({ action: AuditAction.OTP_SENT, phone: phoneE164, ip, userAgent })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[OTP Start] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      // Security: Don't log phone numbers in errors
      error: error
    })
    
    // Return more specific error if available
    const errorMessage = error instanceof Error ? error.message : '發送驗證碼失敗'
    return NextResponse.json({ 
      success: false, 
      error: errorMessage.includes('Invalid parameter') ? '電話號碼格式不正確' : '發送驗證碼失敗，請稍後再試'
    }, { status: 500 })
  }
}


