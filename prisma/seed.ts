import { prisma } from '../src/clients/prisma.client.js';
import { seedCurrencies } from './seeders/currency.seeder.js';
import { seedProviders } from './seeders/provider.seeder.js';
import { seedExchangeRates } from './seeders/exchange-rate.seeder.js';
import { seedCommunityRates } from './seeders/community-rate.seeder.js';

/**
 * Main seed orchestrator.
 *
 * Runs each seeder in dependency order:
 *   1. Currencies      — no dependencies.
 *   2. Providers       — no dependencies.
 *   3. Exchange rates  — depends on currencies + providers.
 *   4. Community rates — depends on currencies only.
 *
 * Invoked via `npm run prisma:seed` (tsx prisma/seed.ts), or
 * automatically by Prisma after `prisma migrate reset`.
 */
async function main(): Promise<void> {
  const currencies = await seedCurrencies();
  const providers = await seedProviders();
  await seedExchangeRates(currencies, providers);
  await seedCommunityRates(currencies);
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    // Always close the Prisma connection, whether seeding succeeded
    // or failed, so the process can exit cleanly.
    await prisma.$disconnect();
  });