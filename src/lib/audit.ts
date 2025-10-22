import { prisma } from '@/lib/prisma'
import { AuditAction } from '@prisma/client'

export async function logAudit(params: {
  action: AuditAction
  userId?: string | null
  phone?: string | null
  ip?: string | null
  userAgent?: string | null
  metadata?: Record<string, unknown> | null
}) {
  await prisma.auditLog.create({
    data: {
      action: params.action,
      userId: params.userId || undefined,
      phone: params.phone || undefined,
      ip: params.ip || undefined,
      userAgent: params.userAgent || undefined,
      metadata: (params.metadata as any) || undefined,
    },
  })
}


