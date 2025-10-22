import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromCookie } from '@/lib/auth/session'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Update user role (Admin and Manager)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromCookie()
    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
      return NextResponse.json({ success: false, error: '需要管理權限' }, { status: 403 })
    }

    const { id } = await params
    const { role } = await request.json()

    if (!role || !['EMPLOYEE', 'MANAGER', 'ADMIN'].includes(role)) {
      return NextResponse.json({ success: false, error: '角色無效' }, { status: 400 })
    }

    // Prevent admin from changing their own role
    if (id === session.userId) {
      return NextResponse.json({ success: false, error: '不能修改自己的角色' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role: role as Role },
      select: {
        id: true,
        phoneE164: true,
        role: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('[Admin] Update user role error:', error)
    return NextResponse.json({ success: false, error: '更新用戶角色失敗' }, { status: 500 })
  }
}

// Delete user (Admin and Manager)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromCookie()
    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
      return NextResponse.json({ success: false, error: '需要管理權限' }, { status: 403 })
    }

    const { id } = await params

    // Prevent admin from deleting themselves
    if (id === session.userId) {
      return NextResponse.json({ success: false, error: '不能刪除自己的帳號' }, { status: 400 })
    }

    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin] Delete user error:', error)
    return NextResponse.json({ success: false, error: '刪除用戶失敗' }, { status: 500 })
  }
}

