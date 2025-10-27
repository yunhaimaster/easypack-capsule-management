/**
 * Temporary API endpoint to migrate work order statuses
 * This will be deleted after migration is complete
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromCookie } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: '需要管理員權限' },
        { status: 403 }
      )
    }

    // Get current status counts
    const statusCounts = await prisma.unifiedWorkOrder.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })

    // Update existing statuses to new system
    const updateResult = await prisma.unifiedWorkOrder.updateMany({
      where: {
        status: {
          in: ['PENDING', 'NOTIFIED', 'SHIPPED', 'ON_HOLD', 'DRAFT'] as any
        }
      },
      data: {
        status: null as any  // Set to NULL for ongoing work
      }
    })

    // Get updated status counts
    const updatedStatusCounts = await prisma.unifiedWorkOrder.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Status migration completed',
      data: {
        before: statusCounts,
        after: updatedStatusCounts,
        updatedCount: updateResult.count
      }
    })

  } catch (error) {
    console.error('[Status Migration] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Migration failed' 
      },
      { status: 500 }
    )
  }
}
