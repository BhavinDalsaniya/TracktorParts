/**
 * Database connection using Prisma
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Create a singleton instance of Prisma Client
class PrismaClientSingleton {
  private static instance: PrismaClient | null = null;

  public static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({
        log: [
          {
            emit: 'event',
            level: 'query',
          },
          {
            emit: 'event',
            level: 'error',
          },
          {
            emit: 'event',
            level: 'warn',
          },
        ],
      });

      // Log queries in development
      if (process.env.NODE_ENV === 'development') {
        PrismaClientSingleton.instance.$on('query' as never, (e: any) => {
          logger.debug(`Query: ${e.query}`);
          logger.debug(`Params: ${e.params}`);
          logger.debug(`Duration: ${e.duration}ms`);
        });
      }

      // Log errors
      PrismaClientSingleton.instance.$on('error' as never, (e: any) => {
        logger.error(`Prisma Error: ${e.message}`);
      });

      logger.info('Database connection established');
    }

    return PrismaClientSingleton.instance;
  }

  public static async disconnect(): Promise<void> {
    if (PrismaClientSingleton.instance) {
      await PrismaClientSingleton.instance.$disconnect();
      PrismaClientSingleton.instance = null;
      logger.info('Database connection closed');
    }
  }
}

// Export the singleton instance
export const prisma = PrismaClientSingleton.getInstance();

// Graceful shutdown
process.on('beforeExit', async () => {
  await PrismaClientSingleton.disconnect();
});

process.on('SIGINT', async () => {
  await PrismaClientSingleton.disconnect();
});

process.on('SIGTERM', async () => {
  await PrismaClientSingleton.disconnect();
});

export default prisma;
