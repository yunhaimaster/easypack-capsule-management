import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromCookie } from '@/lib/auth/session'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Get all users (Admin and Manager can view)
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie()
    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
      return NextResponse.json({ success: false, error: '需要管理權限' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        phoneE164: true,
        nickname: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sessions: true,
            devices: true,
            auditLogs: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error('[Admin] Get users error:', error)
    return NextResponse.json({ success: false, error: '獲取用戶列表失敗' }, { status: 500 })
  }
}

// Add new user (Admin and Manager)
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie()
    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
      return NextResponse.json({ success: false, error: '需要管理權限' }, { status: 403 })
    }

    let { phoneE164, role } = await request.json()
    
    // Remove all spaces from phone number
    phoneE164 = phoneE164?.replace(/\s+/g, '').trim()

    if (!phoneE164 || !phoneE164.startsWith('+')) {
      return NextResponse.json({ success: false, error: '請輸入有效的電話號碼（8位數字或完整國際格式）' }, { status: 400 })
    }
    
    // Validate E.164 format: +[country code][number] (max 15 digits total)
    if (!/^\+[1-9]\d{1,14}$/.test(phoneE164)) {
      return NextResponse.json({ success: false, error: '請輸入有效的電話號碼（8位數字或完整國際格式）' }, { status: 400 })
    }

    if (!role || !['EMPLOYEE', 'MANAGER', 'ADMIN'].includes(role)) {
      return NextResponse.json({ success: false, error: '角色無效' }, { status: 400 })
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { phoneE164 } })
    if (existing) {
      return NextResponse.json({ success: false, error: '此電話號碼已存在' }, { status: 400 })
    }

    const user = await prisma.user.create({
      data: { phoneE164, role: role as Role },
      select: {
        id: true,
        phoneE164: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sessions: true,
            devices: true,
            auditLogs: true,
          }
        }
      }
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('[Admin] Create user error:', error)
    return NextResponse.json({ success: false, error: '創建用戶失敗' }, { status: 500 })
  }
}

