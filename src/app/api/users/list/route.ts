/**
 * Users API - List Users for Work Order Assignment
 * 
 * GET /api/users/list - Get list of all users (for person in charge / customer service selection)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/middleware/work-order-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/users/list
 * 
 * Get list of all users with basic information for selection dropdowns.
 * Used in work order forms for:
 * - Person in charge selection (負責人)
 * - Customer service selection (客服)
 * 
 * Accessible by EMPLOYEE+ (all authenticated users)
 * 
 * Returns:
 * - id: User ID (CUID)
 * - nickname: Display name (preferred)
 * - phoneE164: Phone number (fallback if no nickname)
 * 
 * Sorted by:
 * 1. nickname (asc, nulls last)
 * 2. phoneE164 (asc)
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      )
    }

    // Authorization check - READ permission required (same as work orders)
    if (!hasPermission(session.user.role, 'READ')) {
      return NextResponse.json(
        { success: false, error: '權限不足' },
        { status: 403 }
      )
    }

    // Fetch all users with basic info
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nickname: true,
        phoneE164: true
      },
      orderBy: [
        { nickname: { sort: 'asc', nulls: 'last' } },
        { phoneE164: 'asc' }
      ]
    })

    return NextResponse.json(
      {
        success: true,
        data: users
      },
      {
        headers: {
          // Cache for 5 minutes (users don't change frequently)
          'Cache-Control': 'private, max-age=300'
        }
      }
    )
  } catch (error) {
    console.error('[API] GET /api/users/list error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '查詢用戶列表失敗'
      },
      { status: 500 }
    )
  }
}

