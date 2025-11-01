import { prisma } from '@/lib/prisma'
import { ErrorSeverity } from '@prisma/client'

interface LogErrorParams {
  message: string
  stack?: string
  severity?: ErrorSeverity
  pageUrl?: string
  apiRoute?: string
  httpStatus?: number
  userId?: string
  userAgent?: string
  ip?: string
  metadata?: Record<string, any>
}

/**
 * Server-only function to log errors to database
 * Must only be used in API routes or server components
 */
export async function logError(params: LogErrorParams): Promise<void> {
  try {
    await prisma.errorLog.create({
      data: {
        message: params.message,
        stack: params.stack,
        severity: params.severity || ErrorSeverity.ERROR,
        pageUrl: params.pageUrl,
        apiRoute: params.apiRoute,
        httpStatus: params.httpStatus,
        userId: params.userId,
        userAgent: params.userAgent,
        ip: params.ip,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : null
      }
    })
  } catch (error) {
    // Fallback to console if DB logging fails
    console.error('[ErrorLogger] Failed to log error:', error)
  }
}

