import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    
    // Verify secret token for security
    if (secret !== process.env.REVALIDATE_SECRET) {
      logger.warn('Invalid revalidation secret attempted', { secret: secret?.substring(0, 4) + '...' })
      return NextResponse.json({ success: false, error: 'Invalid secret' }, { status: 401 })
    }

    const path = searchParams.get('path')
    const tag = searchParams.get('tag')

    if (path) {
      revalidatePath(path)
      logger.info('Path revalidated', { path })
      return NextResponse.json({ 
        success: true, 
        revalidated: true, 
        type: 'path',
        path,
        timestamp: Date.now() 
      })
    }

    if (tag) {
      revalidateTag(tag)
      logger.info('Tag revalidated', { tag })
      return NextResponse.json({ 
        success: true, 
        revalidated: true, 
        type: 'tag',
        tag,
        timestamp: Date.now() 
      })
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Missing path or tag parameter' 
    }, { status: 400 })

  } catch (error) {
    logger.error('Revalidation error', {
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json({ 
      success: false, 
      error: 'Revalidation failed' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    
    // Verify secret token for security
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ success: false, error: 'Invalid secret' }, { status: 401 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Revalidation endpoint is active',
      timestamp: Date.now(),
      usage: 'POST /api/revalidate?secret=YOUR_SECRET&path=/orders or &tag=orders'
    })

  } catch (error) {
    logger.error('Revalidation endpoint error', {
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json({ 
      success: false, 
      error: 'Endpoint error' 
    }, { status: 500 })
  }
}
