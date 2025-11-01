import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { Role, ErrorSeverity } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie()
    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
      return NextResponse.json({ success: false, error: '需要管理權限' }, { status: 403 })
    }

    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const severity = url.searchParams.get('severity')
    const search = url.searchParams.get('search')
    const resolved = url.searchParams.get('resolved')
    const limit = parseInt(url.searchParams.get('limit') || '30')
    const page = parseInt(url.searchParams.get('page') || '1')

    const where = {
      ...(userId ? { userId } : {}),
      ...(severity ? { severity: severity as ErrorSeverity } : {}),
      ...(resolved !== null ? { resolved: resolved === 'true' } : {}),
      ...(search ? {
        OR: [
          { message: { contains: search, mode: 'insensitive' as const } },
          { pageUrl: { contains: search, mode: 'insensitive' as const } },
          { apiRoute: { contains: search, mode: 'insensitive' as const } }
        ]
      } : {})
    }

    const [errors, total] = await Promise.all([
      prisma.errorLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              phoneE164: true,
              nickname: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.errorLog.count({ where })
    ])

    return NextResponse.json({
      success: true,
      errors,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('[Admin] Get error logs error:', error)
    return NextResponse.json({ success: false, error: '獲取錯誤日誌失敗' }, { status: 500 })
  }
}

