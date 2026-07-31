import { prisma } from '../../src/clients/prisma.client.js';
import type { ProviderModel } from '../../generated/prisma/models/Provider.js';

/**
 * Seeds or updates external FX API providers.
 *
 * A "provider" here is strictly an automated, external data source
 * (e.g. a currency exchange API) — NOT a user or a community/parallel
 * rate. User-submitted parallel/street-market rates are modeled
 * separately via CommunityRate (see community-rate.seeder.ts), since
 * many users can submit different rates for the same currency pair,
 * unlike a Provider which has one current rate per pair.
 *
 * - `ExchangeRate-API`: the primary external FX data source used in
 *   production (priority 0, the lowest/most-preferred value).
 * - `Test Provider`: a placeholder provider for local development and
 *   automated tests, so test code doesn't need to hit a real external
 *   API. Seeded as inactive (`isActive: false`) so it's never
 *   accidentally picked up by the future FX Synchronization job
 *   (Phase 5) unless a test explicitly enables it.
 *
 * Uses `upsert` keyed on the unique `name` field, so this is safe to
 * re-run repeatedly.
 *
 * @returns The list of seeded/updated Provider records.
 */
export async function seedProviders(): Promise<ProviderModel[]> {
  const providers = await Promise.all(
    [
      {
        name: 'ExchangeRate-API',
        baseUrl: 'https://api.exchangerate-api.com/v4',
        priority: 0,
        isActive: true,
      },
      {
        name: 'Test Provider',
        baseUrl: 'https://api.test.local/v1',
        priority: 10,
        isActive: false,
      },
    ].map((providerData) =>
      prisma.provider.upsert({
        where: { name: providerData.name },
        update: {},
        create: providerData,
      }),
    ),
  );

  providers.forEach((provider) => console.log(`Seeded provider: ${provider.name}`));
  return providers;
}