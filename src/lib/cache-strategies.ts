'use server'

import { unstable_cache } from 'next/cache'
import { revalidateTag, revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

// Cache tags for granular invalidation
export const CACHE_TAGS = {
  ORDERS: 'orders',
  RECIPES: 'recipes',
  WORKLOGS: 'worklogs',
  INGREDIENTS: 'ingredients',
  USER_STATS: 'user-stats',
} as const

// Cache durations
export const CACHE_DURATION = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const

// Production Orders Cache
export const getCachedOrders = unstable_cache(
  async (page: number = 1, limit: number = 30, search?: string) => {
    const skip = (page - 1) * limit
    
    const where = search ? {
      OR: [
        { customerName: { contains: search, mode: 'insensitive' as const } },
        { productName: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {}

    const [orders, totalCount] = await Promise.all([
      prisma.productionOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ingredients: true,
          worklogs: true,
        },
      }),
      prisma.productionOrder.count({ where }),
    ])

    return {
      orders,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    }
  },
  ['orders-list'],
  {
    tags: [CACHE_TAGS.ORDERS],
    revalidate: CACHE_DURATION.MEDIUM,
  }
)

export const getCachedOrder = unstable_cache(
  async (id: string) => {
    return await prisma.productionOrder.findUnique({
      where: { id },
      include: {
        ingredients: true,
        worklogs: {
          orderBy: { startTime: 'desc' },
        },
      },
    })
  },
  ['order-detail'],
  {
    tags: [CACHE_TAGS.ORDERS],
    revalidate: CACHE_DURATION.SHORT,
  }
)

// Recipe Library Cache
export const getCachedRecipes = unstable_cache(
  async (page: number = 1, limit: number = 30, type?: string) => {
    const skip = (page - 1) * limit
    
    const where = type ? { recipeType: type } : {}

    const [recipes, totalCount] = await Promise.all([
      prisma.recipeLibrary.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ingredients: true,
        },
      }),
      prisma.recipeLibrary.count({ where }),
    ])

    return {
      recipes,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    }
  },
  ['recipes-list'],
  {
    tags: [CACHE_TAGS.RECIPES],
    revalidate: CACHE_DURATION.LONG,
  }
)

export const getCachedRecipe = unstable_cache(
  async (id: string) => {
    return await prisma.recipeLibrary.findUnique({
      where: { id },
      include: {
        ingredients: true,
      },
    })
  },
  ['recipe-detail'],
  {
    tags: [CACHE_TAGS.RECIPES],
    revalidate: CACHE_DURATION.MEDIUM,
  }
)

// Worklogs Cache
export const getCachedWorklogs = unstable_cache(
  async (page: number = 1, limit: number = 30, orderId?: string) => {
    const skip = (page - 1) * limit
    
    const where = orderId ? { orderId } : {}

    const [worklogs, totalCount] = await Promise.all([
      prisma.orderWorklog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              customerName: true,
              productName: true,
            },
          },
        },
      }),
      prisma.orderWorklog.count({ where }),
    ])

    return {
      worklogs,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    }
  },
  ['worklogs-list'],
  {
    tags: [CACHE_TAGS.WORKLOGS],
    revalidate: CACHE_DURATION.SHORT,
  }
)

// Statistics Cache
export const getCachedStats = unstable_cache(
  async () => {
    const [
      totalOrders,
      totalRecipes,
      totalWorklogs,
      recentOrders,
      popularRecipes,
    ] = await Promise.all([
      prisma.productionOrder.count(),
      prisma.recipeLibrary.count(),
      prisma.orderWorklog.count(),
      prisma.productionOrder.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      prisma.recipeLibrary.findMany({
        take: 5,
        orderBy: { usageCount: 'desc' },
        select: {
          id: true,
          recipeName: true,
          usageCount: true,
        },
      }),
    ])

    return {
      totalOrders,
      totalRecipes,
      totalWorklogs,
      recentOrders,
      popularRecipes,
      lastUpdated: new Date(),
    }
  },
  ['dashboard-stats'],
  {
    tags: [CACHE_TAGS.USER_STATS],
    revalidate: CACHE_DURATION.MEDIUM,
  }
)

// Cache invalidation functions
export async function invalidateOrdersCache(orderId?: string) {
  try {
    revalidateTag(CACHE_TAGS.ORDERS)
    if (orderId) {
      revalidatePath(`/orders/${orderId}`)
    }
    revalidatePath('/orders')
    logger.info('Orders cache invalidated', { orderId })
  } catch (error) {
    logger.error('Failed to invalidate orders cache', { error })
  }
}

export async function invalidateRecipesCache(recipeId?: string) {
  try {
    revalidateTag(CACHE_TAGS.RECIPES)
    if (recipeId) {
      revalidatePath(`/recipe-library/${recipeId}`)
    }
    revalidatePath('/recipe-library')
    logger.info('Recipes cache invalidated', { recipeId })
  } catch (error) {
    logger.error('Failed to invalidate recipes cache', { error })
  }
}

export async function invalidateWorklogsCache(orderId?: string) {
  try {
    revalidateTag(CACHE_TAGS.WORKLOGS)
    revalidatePath('/worklogs')
    if (orderId) {
      revalidatePath(`/orders/${orderId}`)
    }
    logger.info('Worklogs cache invalidated', { orderId })
  } catch (error) {
    logger.error('Failed to invalidate worklogs cache', { error })
  }
}

export async function invalidateStatsCache() {
  try {
    revalidateTag(CACHE_TAGS.USER_STATS)
    revalidatePath('/')
    logger.info('Stats cache invalidated')
  } catch (error) {
    logger.error('Failed to invalidate stats cache', { error })
  }
}

// Preload critical data
export async function preloadCriticalData() {
  try {
    // Preload dashboard stats
    await getCachedStats()
    
    // Preload recent orders
    await getCachedOrders(1, 10)
    
    // Preload recent recipes
    await getCachedRecipes(1, 10)
    
    logger.info('Critical data preloaded successfully')
  } catch (error) {
    logger.error('Failed to preload critical data', { error })
  }
}

// Cache warming function
export async function warmCache() {
  try {
    await Promise.all([
      getCachedStats(),
      getCachedOrders(1, 30),
      getCachedRecipes(1, 30),
      getCachedWorklogs(1, 30),
    ])
    
    logger.info('Cache warmed successfully')
  } catch (error) {
    logger.error('Failed to warm cache', { error })
  }
}
