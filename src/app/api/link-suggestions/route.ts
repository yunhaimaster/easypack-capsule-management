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

    // Ensure all objects are properly serialized (remove any nested objects)
    const cleanedSuggestions = {
      bestMatches: suggestions.bestMatches.map(item => ({
        id: item.id,
        name: item.name,
        customerName: item.customerName,
        person: typeof item.person === 'string' ? item.person : null,
        matchScore: item.matchScore,
        searchRelevance: item.searchRelevance,
        createdAt: item.createdAt,
        completionDate: item.completionDate,
        markedDate: item.markedDate,
        productionQuantity: item.productionQuantity,
        jobNumber: item.jobNumber
      })),
      goodMatches: suggestions.goodMatches.map(item => ({
        id: item.id,
        name: item.name,
        customerName: item.customerName,
        person: typeof item.person === 'string' ? item.person : null,
        matchScore: item.matchScore,
        searchRelevance: item.searchRelevance,
        createdAt: item.createdAt,
        completionDate: item.completionDate,
        markedDate: item.markedDate,
        productionQuantity: item.productionQuantity,
        jobNumber: item.jobNumber
      })),
      ...(suggestions.searchResults && {
        searchResults: suggestions.searchResults.map(item => ({
          id: item.id,
          name: item.name,
          customerName: item.customerName,
          person: typeof item.person === 'string' ? item.person : null,
          matchScore: item.matchScore,
          searchRelevance: item.searchRelevance,
          createdAt: item.createdAt,
          completionDate: item.completionDate,
          markedDate: item.markedDate,
          productionQuantity: item.productionQuantity,
          jobNumber: item.jobNumber
        }))
      }),
      total: suggestions.total
    }

    return NextResponse.json({
      success: true,
      data: cleanedSuggestions
    })

  } catch (error) {
    console.error('[Link Suggestions] Error:', error)
    return NextResponse.json(
      { success: false, error: '獲取建議失敗' },
      { status: 500 }
    )
  }
}

