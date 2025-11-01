/**
 * Manager Scheduling Table API - Check if Work Order is in Scheduling
 * 
 * GET /api/manager-scheduling/check/[workOrderId] - Check if work order is in scheduling table
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma, isConnectionError, reconnectPrisma } from '@/lib/prisma'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/middleware/manager-scheduling-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/manager-scheduling/check/[workOrderId]
 * 
 * Check if a work order is already in the scheduling table.
 * Accessible by all authenticated users (VIEW permission).
 * 
 * Returns:
 * - success: boolean
 * - data: { isInScheduling: boolean, entryId?: string }
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ workOrderId: string }> }
) {
  try {
    // Authentication check
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      )
    }

    // Authorization check - VIEW permission required
    if (!hasPermission(session.user.role, 'VIEW')) {
      return NextResponse.json(
        { success: false, error: '權限不足' },
        { status: 403 }
      )
    }

    const { workOrderId } = await context.params

    // Check if work order exists in scheduling table
    // Use retry logic with connection error handling
    let entry = null
    try {
      entry = await prisma.managerSchedulingEntry.findUnique({
        where: { workOrderId },
        select: { id: true }
      })
    } catch (dbError) {
      // Check if it's a connection error
      if (isConnectionError(dbError)) {
        console.warn('[API] Database connection error, attempting to reconnect...')
        
        // Try to reconnect
        const reconnected = await reconnectPrisma()
        
        if (reconnected) {
          // Retry the query once
          try {
            entry = await prisma.managerSchedulingEntry.findUnique({
              where: { workOrderId },
              select: { id: true }
            })
          } catch (retryError) {
            console.error('[API] Retry failed after reconnection:', retryError)
            // Return graceful default instead of crashing
            return NextResponse.json(
              {
                success: true,
                data: {
                  isInScheduling: false,
                  entryId: null
                }
              },
              {
                headers: {
                  'Cache-Control': 'private, max-age=10'
                }
              }
            )
          }
        } else {
          console.error('[API] Reconnection failed, returning safe default')
          // Connection failed - return safe default
          return NextResponse.json(
            {
              success: true,
              data: {
                isInScheduling: false,
                entryId: null
              }
            },
            {
              headers: {
                'Cache-Control': 'private, max-age=10'
              }
            }
          )
        }
      } else {
        // Not a connection error, rethrow
        throw dbError
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          isInScheduling: !!entry,
          entryId: entry?.id || null
        }
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=10'
        }
      }
    )
  } catch (error) {
    console.error('[API] GET /api/manager-scheduling/check/[workOrderId] error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '查詢失敗'
      },
      { status: 500 }
    )
  }
}

