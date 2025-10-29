import { prisma } from '@/lib/prisma'

export type SourceType = 'work-order' | 'encapsulation-order'

export interface LinkSuggestion {
  id: string
  name: string
  customerName: string
  person: string | null
  matchScore: number
}

export interface LinkSuggestionsResult {
  bestMatches: LinkSuggestion[]
  goodMatches: LinkSuggestion[]
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

  // Calculate match scores
  const scored = targets.map(target => ({
    id: target.id,
    name: target.name,
    customerName: target.customerName,
    person: target.person,
    matchScore: calculateMatchScore(source, target, sourceType)
  }))

  // Group by match score
  const bestMatches = scored
    .filter(s => s.matchScore === 100)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 5)

  const goodMatches = scored
    .filter(s => s.matchScore === 50)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 5)

  return {
    bestMatches,
    goodMatches,
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
}>> {
  if (sourceType === 'work-order') {
    // Source is work order, fetch encapsulation orders (ProductionOrder)
    const where = searchTerm ? {
      OR: [
        { customerName: { contains: searchTerm, mode: 'insensitive' as const } },
        { productName: { contains: searchTerm, mode: 'insensitive' as const } }
      ]
    } : {}

    const orders = await prisma.productionOrder.findMany({
      where,
      select: {
        id: true,
        productName: true,
        customerName: true,
        customerServiceId: true,
        customerService: {
          select: {
            nickname: true,
            phoneE164: true
          }
        }
      },
      take: 100,
      orderBy: { createdAt: 'desc' }
    })

    return orders.map(order => ({
      id: order.id,
      name: order.productName,
      customerName: order.customerName,
      personId: order.customerServiceId,
      person: (order.customerService?.nickname || order.customerService?.phoneE164 || null) as string | null
    }))
  } else {
    // Source is encapsulation order, fetch work orders
    const where = searchTerm ? {
      OR: [
        { customerName: { contains: searchTerm, mode: 'insensitive' as const } },
        { jobNumber: { contains: searchTerm, mode: 'insensitive' as const } }
      ]
    } : {}

    const workOrders = await prisma.unifiedWorkOrder.findMany({
      where,
      select: {
        id: true,
        jobNumber: true,
        customerName: true,
        personInChargeId: true,
        personInCharge: {
          select: {
            nickname: true,
            phoneE164: true
          }
        }
      },
      take: 100,
      orderBy: { markedDate: 'desc' }
    })

    return workOrders.map(wo => ({
      id: wo.id,
      name: wo.jobNumber || `工作單 - ${wo.customerName}`,
      customerName: wo.customerName,
      personId: wo.personInChargeId,
      person: (wo.personInCharge?.nickname || wo.personInCharge?.phoneE164 || null) as string | null
    }))
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

