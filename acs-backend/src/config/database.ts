import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const prisma =
  globalThis.__prisma ||
  new PrismaClient({
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
        level: 'info',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
  });

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

// Log database queries in development
// Note: Query logging requires specific Prisma configuration
if (process.env.NODE_ENV === 'development') {
  // prisma.$on('query', e => {
  //   logger.debug('Query: ' + e.query);
  //   logger.debug('Params: ' + e.params);
  //   logger.debug('Duration: ' + e.duration + 'ms');
  // });
}

// prisma.$on('error', e => {
//   logger.error('Database error:', e);
// });

export { prisma };

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Database disconnection failed:', error);
  }
};
