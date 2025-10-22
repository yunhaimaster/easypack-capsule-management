import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromCookie } from '@/lib/auth/session'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Get audit logs (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie()
    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ success: false, error: '需要管理員權限' }, { status: 403 })
    }

    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const action = url.searchParams.get('action')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const page = parseInt(url.searchParams.get('page') || '1')

    const where = {
      ...(userId ? { userId } : {}),
      ...(action ? { action: action as any } : {})
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              phoneE164: true,
              role: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.auditLog.count({ where })
    ])

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('[Admin] Get audit logs error:', error)
    return NextResponse.json({ success: false, error: '獲取審計日誌失敗' }, { status: 500 })
  }
}

