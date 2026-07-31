import { env } from "./env.js";

/**
 * Database configuration.
 *
 * This module centralizes all database-related settings.
 * Prisma and any future database utilities should import
 * configuration from here instead of reading environment
 * variables directly.
 */
export const databaseConfig = {
  /**
   * PostgreSQL connection string.
   */
  url: env.DATABASE_URL,
} as const;
