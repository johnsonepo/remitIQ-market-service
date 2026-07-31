import { prisma } from '../../src/clients/prisma.client.js';
import type { CurrencyModel } from '../../generated/prisma/models/Currency.js';
import type { ProviderModel } from '../../generated/prisma/models/Provider.js';
import type { ExchangeRateModel } from '../../generated/prisma/models/ExchangeRate.js';

/**
 * Internal shape used to build the list of rates to seed, before
 * they're persisted via Prisma.
 */
interface SeedRate {
  base: CurrencyModel;
  quote: CurrencyModel;
  rate: number;
}

/**
 * Seeds current official exchange rates for every tracked currency
 * (except XAF itself) against XAF, using the primary external
 * provider ("ExchangeRate-API").
 *
 * These are placeholder values for local development only — they will
 * be overwritten with real fetched rates once the FX Synchronization
 * job (Phase 5) is implemented. Do not treat these numbers as accurate
 * for any real financial calculation.
 *
 * @param currencies - The full list of seeded Currency records
 *                      (typically the return value of seedCurrencies).
 * @param providers - The full list of seeded Provider records
 *                     (typically the return value of seedProviders).
 *                     Only the "ExchangeRate-API" provider is used here.
 * @returns The list of created/updated ExchangeRate records.
 */
export async function seedExchangeRates(
  currencies: CurrencyModel[],
  providers: ProviderModel[],
): Promise<ExchangeRateModel[]> {
  const xaf = currencies.find((c) => c.code === 'XAF')!;
  const officialProvider = providers.find((p) => p.name === 'ExchangeRate-API')!;

  /** Placeholder official rates, currency code -> rate against XAF. */
  const officialRates: Record<string, number> = {
    USD: 610.5,
    EUR: 655.96,
    GBP: 765.3,
    AED: 166.2,
  };

  const seedList: SeedRate[] = [];

  for (const currency of currencies) {
    if (currency.code === 'XAF') continue; // XAF is the quote currency, never its own base here
    const rate = officialRates[currency.code];
    if (rate === undefined) continue; // skip any currency without an explicit seed rate
    seedList.push({ base: currency, quote: xaf, rate });
  }

  const created: ExchangeRateModel[] = [];

  for (const seed of seedList) {
    // upsert keyed on the compound unique (base, quote, provider), so
    // re-running the seed updates the existing row rather than
    // duplicating it.
    const result = await prisma.exchangeRate.upsert({
      where: {
        baseCurrencyId_quoteCurrencyId_providerId: {
          baseCurrencyId: seed.base.id,
          quoteCurrencyId: seed.quote.id,
          providerId: officialProvider.id,
        },
      },
      update: {},
      create: {
        baseCurrencyId: seed.base.id,
        quoteCurrencyId: seed.quote.id,
        providerId: officialProvider.id,
        rate: seed.rate,
      },
    });

    console.log(`Seeded ${seed.base.code} -> ${seed.quote.code}: ${result.rate.toString()}`);
    created.push(result);
  }

  return created;
}