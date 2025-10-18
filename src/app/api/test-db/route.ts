import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const result = await prisma.$queryRaw`
      SELECT 1 as ok
    `

    logger.info('Database health check succeeded')

    return NextResponse.json({
      success: true,
      result
    })
  } catch (error) {
    logger.error('Database check error', {
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Database check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
