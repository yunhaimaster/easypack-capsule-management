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

export function getClientErrorLogger() {
  return async (error: Error, context?: Record<string, any>) => {
    try {
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          pageUrl: window.location.href,
          userAgent: navigator.userAgent,
          metadata: context
        })
      })
    } catch (logError) {
      console.error('[ClientErrorLogger] Failed:', logError)
    }
  }
}

