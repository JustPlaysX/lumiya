import { PrismaClient } from '@prisma/client';
import { logger } from '../logger.js';

export const prisma = new PrismaClient();

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  logger.info('✅ Datenbank verbunden (PostgreSQL)');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
