import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/error-logger'
import { getSessionFromCookie } from '@/lib/auth/session'
import { ErrorSeverity } from '@prisma/client'
import { z } from 'zod'

const logErrorSchema = z.object({
  message: z.string().min(1).max(2000),
  stack: z.string().optional(),
  pageUrl: z.string().optional(),
  severity: z.enum(['WARNING', 'ERROR']).optional(),
  metadata: z.record(z.any()).optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie()
    const body = await request.json()
    const validated = logErrorSchema.parse(body)

    await logError({
      message: validated.message,
      stack: validated.stack,
      pageUrl: validated.pageUrl,
      severity: validated.severity === 'WARNING' ? ErrorSeverity.WARNING : ErrorSeverity.ERROR,
      userId: session?.userId,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      metadata: validated.metadata
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Error logging failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to log error' },
      { status: 500 }
    )
  }
}

