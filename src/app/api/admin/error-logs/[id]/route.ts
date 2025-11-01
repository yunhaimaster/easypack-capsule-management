import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookie()
    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ success: false, error: '需要管理員權限' }, { status: 403 })
    }

    const { id } = await context.params
    const { resolved } = await request.json()

    await prisma.errorLog.update({
      where: { id },
      data: { resolved }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin] Update error log error:', error)
    return NextResponse.json({ success: false, error: '更新失敗' }, { status: 500 })
  }
}

