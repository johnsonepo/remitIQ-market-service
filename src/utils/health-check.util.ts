import { prisma } from '../clients/prisma.client.js';
import { logger } from './logger.js';

/**
 * Checks whether the database is reachable by running a trivial
 * query. Used by the readiness endpoint to verify the service can
 * actually serve requests that depend on the database, not just that
 * the process is alive.
 *
 * @returns true if the database responds, false otherwise.
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Health check: database connection failed');
    return false;
  }
}