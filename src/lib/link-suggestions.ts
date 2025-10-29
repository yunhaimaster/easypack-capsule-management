import { prisma } from '@/lib/prisma'

export type SourceType = 'work-order' | 'encapsulation-order'

export interface LinkSuggestion {
  id: string
  name: string
  customerName: string
  person: string | null
  matchScore: number
  searchRelevance?: number  // 0-100, higher = more relevant to search term
  // Additional distinguishing fields
  createdAt?: string  // ISO date string
  completionDate?: string | null  // For encapsulation orders
  markedDate?: string  // For work orders
  productionQuantity?: number | null
  jobNumber?: string | null  // For work orders
}

export interface LinkSuggestionsResult {
  bestMatches: LinkSuggestion[]
  goodMatches: LinkSuggestion[]
  searchResults?: LinkSuggestion[]  // Sorted search results when searching
  total: number
}

/**
 * Calculate smart link suggestions based on customerName and person matching
 * @param sourceType - Type of the source order
 * @param sourceId - ID of the source order
 * @param searchTerm - Optional search term for filtering
 * @returns Grouped suggestions with match scores
 */
export async function calculateLinkSuggestions(
  sourceType: SourceType,
  sourceId: string,
  searchTerm?: string
): Promise<LinkSuggestionsResult> {
  // Fetch source order
  const source = await fetchSourceOrder(sourceType, sourceId)
  
  if (!source) {
    return { bestMatches: [], goodMatches: [], total: 0 }
  }

  // Fetch potential target orders
  const targets = await fetchTargetOrders(sourceType, searchTerm)

  // Calculate match scores and relevance for search results
  const searchLower = searchTerm?.toLowerCase().trim()
  
  const scored = targets.map(target => {
    // Ensure person is always a primitive string, never an object
    const personValue = typeof target.person === 'string' 
      ? target.person 
      : (target.person === null || target.person === undefined ? null : String(target.person))
    
    const matchScore = calculateMatchScore(source, target, sourceType)
    
    // Calculate search relevance score if searching
    let searchRelevance = 0
    if (searchLower) {
      const nameLower = target.name.toLowerCase()
      const customerLower = target.customerName.toLowerCase()
      const personLower = personValue?.toLowerCase() || ''
      const idLower = target.id.toLowerCase()
      
      // Priority: exact match > starts with > contains
      if (nameLower === searchLower || customerLower === searchLower) {
        searchRelevance = 100
      } else if (nameLower.startsWith(searchLower) || customerLower.startsWith(searchLower)) {
        searchRelevance = 80
      } else if (nameLower.includes(searchLower) || customerLower.includes(searchLower)) {
        searchRelevance = 60
      } else if (personLower.includes(searchLower)) {
        searchRelevance = 40
      } else if (idLower.includes(searchLower)) {
        searchRelevance = 20
      }
    }
    
    return {
      id: target.id,
      name: target.name,
      customerName: target.customerName,
      person: personValue,
      matchScore,
      searchRelevance,
      createdAt: target.createdAt,
      completionDate: target.completionDate,
      markedDate: target.markedDate,
      productionQuantity: target.productionQuantity,
      jobNumber: target.jobNumber
    }
  })

  // If searching, sort by search relevance first, then match score
  // If not searching, sort by match score
  const sorted = searchTerm
    ? scored.sort((a, b) => {
        // Search mode: relevance > match score > name
        if (b.searchRelevance !== a.searchRelevance) {
          return b.searchRelevance - a.searchRelevance
        }
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore
        }
        return a.name.localeCompare(b.name)
      })
    : scored.sort((a, b) => {
        // Suggestion mode: match score > name
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore
        }
        return a.name.localeCompare(b.name)
      })

  // Group by match score (only for suggestions, not search)
  const bestMatches = searchTerm 
    ? [] 
    : sorted
        .filter(s => s.matchScore === 100)
        .slice(0, 5)

  const goodMatches = searchTerm
    ? []
    : sorted
        .filter(s => s.matchScore === 50)
        .slice(0, 5)

  return {
    bestMatches,
    goodMatches,
    searchResults: searchTerm ? sorted : [],
    total: targets.length
  }
}

/**
 * Fetch source order data
 */
async function fetchSourceOrder(sourceType: SourceType, sourceId: string) {
  if (sourceType === 'work-order') {
    const workOrder = await prisma.unifiedWorkOrder.findUnique({
      where: { id: sourceId },
      select: {
        id: true,
        customerName: true,
        personInChargeId: true
      }
    })
    return workOrder ? {
      id: workOrder.id,
      customerName: workOrder.customerName,
      personId: workOrder.personInChargeId
    } : null
  } else {
    const order = await prisma.productionOrder.findUnique({
      where: { id: sourceId },
      select: {
        id: true,
        customerName: true,
        customerServiceId: true
      }
    })
    return order ? {
      id: order.id,
      customerName: order.customerName,
      personId: order.customerServiceId
    } : null
  }
}

/**
 * Fetch potential target orders
 */
async function fetchTargetOrders(sourceType: SourceType, searchTerm?: string): Promise<Array<{
  id: string
  name: string
  customerName: string
  personId: string | null
  person: string | null
  createdAt?: string
  completionDate?: string | null
  markedDate?: string
  productionQuantity?: number | null
  jobNumber?: string | null
}>> {
  if (sourceType === 'work-order') {
    // Source is work order, fetch encapsulation orders (ProductionOrder)
    // Enhanced search: searches customerName, productName, person name, and ID
    const cleanedSearch = searchTerm?.trim()
    const where = cleanedSearch ? {
      OR: [
        { customerName: { contains: cleanedSearch, mode: 'insensitive' as const } },
        { productName: { contains: cleanedSearch, mode: 'insensitive' as const } },
        { id: { contains: cleanedSearch, mode: 'insensitive' as const } },
        {
          customerService: {
            OR: [
              { nickname: { contains: cleanedSearch, mode: 'insensitive' as const } },
              { phoneE164: { contains: cleanedSearch, mode: 'insensitive' as const } }
            ]
          }
        }
      ]
    } : {}

    const orders = await prisma.productionOrder.findMany({
      where,
      select: {
        id: true,
        productName: true,
        customerName: true,
        customerServiceId: true,
        createdAt: true,
        completionDate: true,
        productionQuantity: true,
        customerService: {
          select: {
            nickname: true,
            phoneE164: true
          }
        }
      },
      take: 200,  // Increased limit for better search coverage
      orderBy: { createdAt: 'desc' }
    })

    return orders.map(order => {
      // Explicitly extract string value and discard object
      const personName = order.customerService?.nickname || order.customerService?.phoneE164 || null
      return {
        id: order.id,
        name: order.productName,
        customerName: order.customerName,
        personId: order.customerServiceId,
        person: personName,
        createdAt: order.createdAt.toISOString(),
        completionDate: order.completionDate?.toISOString() || null,
        productionQuantity: order.productionQuantity
      }
    })
  } else {
    // Source is encapsulation order, fetch work orders
    // Enhanced search: searches customerName, jobNumber, person name, and ID
    const cleanedSearch = searchTerm?.trim()
    const where = cleanedSearch ? {
      OR: [
        { customerName: { contains: cleanedSearch, mode: 'insensitive' as const } },
        { jobNumber: { contains: cleanedSearch, mode: 'insensitive' as const } },
        { id: { contains: cleanedSearch, mode: 'insensitive' as const } },
        {
          personInCharge: {
            OR: [
              { nickname: { contains: cleanedSearch, mode: 'insensitive' as const } },
              { phoneE164: { contains: cleanedSearch, mode: 'insensitive' as const } }
            ]
          }
        }
      ]
    } : {}

    const workOrders = await prisma.unifiedWorkOrder.findMany({
      where,
      select: {
        id: true,
        jobNumber: true,
        customerName: true,
        personInChargeId: true,
        markedDate: true,
        createdAt: true,
        productionQuantity: true,
        personInCharge: {
          select: {
            nickname: true,
            phoneE164: true
          }
        }
      },
      take: 200,  // Increased limit for better search coverage
      orderBy: { markedDate: 'desc' }
    })

    return workOrders.map(wo => {
      // Explicitly extract string value and discard object
      const personName = wo.personInCharge?.nickname || wo.personInCharge?.phoneE164 || null
      return {
        id: wo.id,
        name: wo.jobNumber || `工作單 - ${wo.customerName}`,
        customerName: wo.customerName,
        personId: wo.personInChargeId,
        person: personName,
        markedDate: wo.markedDate.toISOString(),
        createdAt: wo.createdAt.toISOString(),
        productionQuantity: wo.productionQuantity,
        jobNumber: wo.jobNumber
      }
    })
  }
}

/**
 * Calculate match score based on customer name and person matching
 */
function calculateMatchScore(
  source: { customerName: string; personId: string | null },
  target: { customerName: string; personId: string | null },
  sourceType: SourceType
): number {
  const customerMatch = source.customerName === target.customerName
  
  // For work-order source: personInChargeId should match customerServiceId
  // For encapsulation-order source: customerServiceId should match personInChargeId
  const personMatch = source.personId && target.personId && source.personId === target.personId

  if (customerMatch && personMatch) return 100  // Best match
  if (customerMatch) return 50  // Good match
  return 0  // No match (search fallback)
}

