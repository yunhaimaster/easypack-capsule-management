import { NextRequest, NextResponse } from 'next/server'
import { calculateLinkSuggestions, SourceType } from '@/lib/link-suggestions'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sourceType = searchParams.get('sourceType') as SourceType | null
    const sourceId = searchParams.get('sourceId')
    const search = searchParams.get('search') || undefined

    // Validation
    if (!sourceType || !sourceId) {
      return NextResponse.json(
        { success: false, error: 'sourceType and sourceId are required' },
        { status: 400 }
      )
    }

    if (sourceType !== 'work-order' && sourceType !== 'encapsulation-order') {
      return NextResponse.json(
        { success: false, error: 'sourceType must be work-order or encapsulation-order' },
        { status: 400 }
      )
    }

    // Calculate suggestions
    const suggestions = await calculateLinkSuggestions(sourceType, sourceId, search)

    return NextResponse.json({
      success: true,
      data: suggestions
    })

  } catch (error) {
    console.error('[Link Suggestions] Error:', error)
    return NextResponse.json(
      { success: false, error: '獲取建議失敗' },
      { status: 500 }
    )
  }
}

