import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaPool: pg.Pool | undefined
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL or DIRECT_URL environment variable is not set')
  }

  const pool =
    globalForPrisma.prismaPool ??
    new pg.Pool({
      connectionString,
      max: Number(process.env.PG_POOL_MAX ?? 3),
      min: 0,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 30_000,
      statement_timeout: 60_000,
      allowExitOnIdle: true,
    })

  if (!globalForPrisma.prismaPool) {
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
    })
    globalForPrisma.prismaPool = pool
  }

  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Cache prisma instance in both development and production to avoid exhausting connection pool
globalForPrisma.prisma = prisma