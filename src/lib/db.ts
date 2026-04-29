import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Optimisé pour Vercel (serverless) + Neon PostgreSQL
// - DATABASE_URL = URL avec pooler Neon (pgbouncer) : postgres://user:pass@ep-xxx.pooler.neon.tech/dbname?sslmode=require
// - DIRECT_DATABASE_URL = URL directe pour les migrations : postgres://user:pass@ep-xxx.neon.tech/dbname?sslmode=require
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
