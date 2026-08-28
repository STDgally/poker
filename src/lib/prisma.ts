import { PrismaClient } from '@prisma/client';

// Standard Next.js pattern: reuse a single PrismaClient across hot reloads in dev
// to avoid exhausting MySQL connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
