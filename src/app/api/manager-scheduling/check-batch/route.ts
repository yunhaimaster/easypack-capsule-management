/**
 * Manager Scheduling Table API - Batch Check Work Orders in Scheduling
 * 
 * POST /api/manager-scheduling/check-batch - Check multiple work orders at once
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma, isConnectionError, reconnectPrisma } from '@/lib/prisma'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/middleware/manager-scheduling-auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const batchCheckSchema = z.object({
  workOrderIds: z.array(z.string()).min(1).max(100) // Limit to 100 at a time
})

/**
 * POST /api/manager-scheduling/check-batch
 * 
 * Check multiple work orders for scheduling status in a single query.
 * Accessible by all authenticated users (VIEW permission).
 * 
 * Body:
 * - workOrderIds: string[] (1-100 work order IDs)
 * 
 * Returns:
 * - success: boolean
 * - data: { [workOrderId: string]: { isInScheduling: boolean, entryId: string | null } }
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = batchCheckSchema.parse(body)

    // Batch fetch all scheduling entries in a single query
    let entries: Array<{ workOrderId: string; id: string }> = []
    try {
      entries = await prisma.managerSchedulingEntry.findMany({
        where: {
          workOrderId: { in: validatedData.workOrderIds }
        },
        select: {
          workOrderId: true,
          id: true
        }
      })
    } catch (dbError) {
      // Check if it's a connection error
      if (isConnectionError(dbError)) {
        console.warn('[API] Batch check: Database connection error, attempting to reconnect...')
        
        // Try to reconnect
        const reconnected = await reconnectPrisma()
        
        if (reconnected) {
          // Retry the query once
          try {
            entries = await prisma.managerSchedulingEntry.findMany({
              where: {
                workOrderId: { in: validatedData.workOrderIds }
              },
              select: {
                workOrderId: true,
                id: true
              }
            })
          } catch (retryError) {
            console.error('[API] Batch check: Retry failed after reconnection:', retryError)
            // Return empty results instead of crashing
            entries = []
          }
        } else {
          console.error('[API] Batch check: Reconnection failed, returning empty results')
          entries = []
        }
      } else {
        // Not a connection error, rethrow
        throw dbError
      }
    }

    // Build result map with all requested IDs
    const result: Record<string, { isInScheduling: boolean; entryId: string | null }> = {}
    const entriesMap = new Map(entries.map(e => [e.workOrderId, e.id]))

    for (const workOrderId of validatedData.workOrderIds) {
      const entryId = entriesMap.get(workOrderId) || null
      result[workOrderId] = {
        isInScheduling: !!entryId,
        entryId
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: result
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=10'
        }
      }
    )
  } catch (error) {
    console.error('[API] POST /api/manager-scheduling/check-batch error:', error)
    
    // If validation error, return specific error
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: ' + error.errors.map(e => e.message).join(', ')
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '查詢失敗'
      },
      { status: 500 }
    )
  }
}

