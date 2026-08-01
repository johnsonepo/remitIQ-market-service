import { prisma } from '../../src/clients/prisma.client.js';

/**
 * Truncates all application tables and resets identity sequences.
 * CASCADE ensures foreign-key-dependent rows (e.g. ExchangeRate
 * referencing Currency) are cleared together, avoiding constraint
 * errors from truncating in the wrong order.
 *
 * Used to reset the test database to a clean slate before each
 * integration test, so tests never see leftover data from a
 * previous test or a previous crashed run.
 */
export async function resetTestDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "alert_events",
      "alert_rules",
      "community_rates",
      "exchange_rate_history",
      "exchange_rates",
      "providers",
      "currencies"
    RESTART IDENTITY CASCADE;
  `);
}