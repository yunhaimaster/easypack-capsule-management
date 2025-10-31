import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Validate database configuration on startup
function validateDatabaseConfig() {
  const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL
  
  if (!DATABASE_URL) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('? CRITICAL: DATABASE_URL is not configured in production environment!')
    }
    console.warn('??  DATABASE_URL is not defined. Database operations will fail.')
    console.warn('?? Create a .env.local file with DATABASE_URL to fix this.')
    return false
  }
  
  // Check for placeholder URL (common mistake)
  if (DATABASE_URL.includes('db.prisma.io')) {
    throw new Error('? CRITICAL: DATABASE_URL contains placeholder value "db.prisma.io". Please configure a real database URL!')
  }
  
  console.log('? Database configuration validated')
  return true
}

// Create a function to get Prisma client with lazy initialization
function getPrismaClient() {
  // Validate configuration first
  validateDatabaseConfig()
  
  // Note: Connection pool parameters should be set in DATABASE_URL environment variable:
  // postgresql://user:password@host:port/db?connection_limit=10&pool_timeout=20&connect_timeout=10
  // Prisma reads the URL from environment variables, not from client options
  
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }
  
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
  
  return client
}

const prismaClient = getPrismaClient()

export const prisma = prismaClient

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaClient
}

/**
 * Check if error is a connection closed error
 */
export function isConnectionError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const err = error as any
    // Prisma connection errors
    if (err.cause?.kind === 'Closed' || err.message?.includes('Connection closed')) {
      return true
    }
    // PostgreSQL connection errors
    if (err.code === '57P01' || err.code === '57P03' || err.code === '08003') {
      return true
    }
    // Error message patterns
    if (typeof err.message === 'string') {
      const message = err.message.toLowerCase()
      return message.includes('connection') && 
             (message.includes('closed') || message.includes('terminated') || message.includes('lost'))
    }
  }
  return false
}

/**
 * Reconnect Prisma client after connection error
 */
export async function reconnectPrisma(): Promise<boolean> {
  try {
    // Try to disconnect current client (may fail if already disconnected)
    try {
      await prisma.$disconnect()
    } catch {
      // Ignore disconnect errors - client may already be disconnected
    }
    
    // Reset global instance to force new client creation
    globalForPrisma.prisma = undefined
    
    // Get new client instance (will be created by getPrismaClient)
    const newClient = getPrismaClient()
    
    // Verify connection works
    await newClient.$queryRaw`SELECT 1`
    
    return true
  } catch (error) {
    console.error('[Prisma] Reconnection failed:', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}

/**
 * Execute query with automatic retry on connection errors
 */
export async function executeWithRetry<T>(
  query: () => Promise<T>,
  maxRetries: number = 2
): Promise<T> {
  let lastError: unknown = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await query()
    } catch (error) {
      lastError = error
      
      // Check if it's a connection error
      if (isConnectionError(error) && attempt < maxRetries) {
        console.warn(`[Prisma] Connection error (attempt ${attempt + 1}/${maxRetries + 1}), attempting reconnection...`)
        
        // Try to reconnect
        const reconnected = await reconnectPrisma()
        if (!reconnected) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
          continue
        }
        
        // Wait a bit before retrying query
        await new Promise(resolve => setTimeout(resolve, 500))
        continue
      }
      
      // Not a connection error or max retries reached
      throw error
    }
  }
  
  throw lastError || new Error('Query failed after retries')
}

export async function verifyDatabaseConnection() {
  try {
    await executeWithRetry(() => prisma.$queryRaw`SELECT 1`)
    return true
  } catch (error) {
    return false
  }
}
