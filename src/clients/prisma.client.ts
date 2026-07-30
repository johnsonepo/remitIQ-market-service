import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../generated/prisma/client.js';
import { databaseConfig } from '../config/index.js';

/**
 * Global declaration augmentation to attach a cached PrismaClient instance 
 * to the Node.js global namespace. This prevents TypeScript compilation errors 
 * when referencing `global.__prisma`.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Initialize the Prisma PostgreSQL driver adapter using the database connection 
 * string retrieved from the application's configuration layer.
 */
const adapter = new PrismaPg({ connectionString: databaseConfig.url });

/**
 * Instantiate a singleton Prisma Client instance. 
 * 
 * - In production: Creates a single fresh connection instance.
 * - In development: Reuses the existing global instance if already cached, 
 *   preventing connection exhaustion caused by hot-reloading tools like `tsx watch`.
 */
export const prisma = global.__prisma ?? new PrismaClient({ adapter });

/**
 * Cache the Prisma client instance globally during local development 
 * to persist across hot-reload cycles.
 */
if (process.env.NODE_ENV === 'development') {
  global.__prisma = prisma;
}