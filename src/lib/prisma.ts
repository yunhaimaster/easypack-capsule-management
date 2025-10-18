import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create a function to get Prisma client with lazy initialization
function getPrismaClient() {
  const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL
  
  if (!DATABASE_URL && process.env.NODE_ENV !== 'production') {
    console.warn('DATABASE_URL is not defined. Database operations will fail.')
  }
  
  return globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

const prismaClient = getPrismaClient()

export const prisma = prismaClient

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaClient
}

export async function verifyDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    return false
  }
}
