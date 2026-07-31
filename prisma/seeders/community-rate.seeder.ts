import { prisma } from '../../src/clients/prisma.client.js';
import type { CurrencyModel } from '../../generated/prisma/models/Currency.js';
import type { CommunityRateModel } from '../../generated/prisma/models/CommunityRate.js';

/**
 * Internal shape used to build the list of community rates to seed.
 */
interface SeedCommunityRate {
  userId: string;
  base: CurrencyModel;
  quote: CurrencyModel;
  rate: number;
  location: string;
}

/**
 * Seeds sample user-submitted parallel/street-market exchange rates.
 *
 * Represents informal rates (e.g. UAE street-market exchanges) that
 * commonly diverge from official API rates, which is exactly the kind
 * of information migrant workers use to decide "is today a good day
 * to send money?" (per the master spec's problem statement).
 *
 * Unlike ExchangeRate, this uses `create` rather than `upsert`,
 * because there is intentionally no uniqueness constraint on
 * (base, quote) here — many different users are expected to submit
 * different rates for the same currency pair, and each submission is
 * an independent observation rather than a single current value.
 *
 * NOTE: because this uses `create`, re-running the seed script will
 * insert duplicate rows each time. This is acceptable for local
 * development but should be guarded (e.g. skip if rows already exist)
 * before running in any shared/staging environment.
 *
 * The `userId` values below are fake placeholders for local
 * development only. Real user IDs will come from the Household
 * Service via JWT once authentication is wired up — Market Service
 * never owns user accounts (see section 14 of the master spec).
 *
 * @param currencies - The full list of seeded Currency records
 *                      (typically the return value of seedCurrencies).
 * @returns The list of created CommunityRate records.
 */
export async function seedCommunityRates(
  currencies: CurrencyModel[],
): Promise<CommunityRateModel[]> {
  const xaf = currencies.find((c) => c.code === 'XAF')!;
  const usd = currencies.find((c) => c.code === 'USD')!;
  const aed = currencies.find((c) => c.code === 'AED')!;
  const eur = currencies.find((c) => c.code === 'EUR')!;
  const gbp = currencies.find((c) => c.code === 'GBP')!;

  const seedData: SeedCommunityRate[] = [
    // USD -> XAF submissions
    { userId: 'dev-user-0001', base: usd, quote: xaf, rate: 625.0, location: 'Douala' },
    { userId: 'dev-user-0004', base: usd, quote: xaf, rate: 622.5, location: 'Yaoundé' },
    { userId: 'dev-user-0005', base: usd, quote: xaf, rate: 628.0, location: 'Douala' },
    { userId: 'dev-user-0006', base: usd, quote: xaf, rate: 619.0, location: 'Bafoussam' },

    // AED -> XAF submissions
    { userId: 'dev-user-0002', base: aed, quote: xaf, rate: 170.5, location: 'Dubai' },
    { userId: 'dev-user-0003', base: aed, quote: xaf, rate: 169.8, location: 'Abu Dhabi' },
    { userId: 'dev-user-0007', base: aed, quote: xaf, rate: 171.2, location: 'Sharjah' },
    { userId: 'dev-user-0008', base: aed, quote: xaf, rate: 168.9, location: 'Dubai' },

    // EUR -> XAF submissions
    { userId: 'dev-user-0009', base: eur, quote: xaf, rate: 660.0, location: 'Paris' },
    { userId: 'dev-user-0010', base: eur, quote: xaf, rate: 657.5, location: 'Brussels' },

    // GBP -> XAF submissions
    { userId: 'dev-user-0011', base: gbp, quote: xaf, rate: 770.0, location: 'London' },
  ];

  const created: CommunityRateModel[] = [];

  for (const data of seedData) {
    const result = await prisma.communityRate.create({
      data: {
        userId: data.userId,
        baseCurrencyId: data.base.id,
        quoteCurrencyId: data.quote.id,
        rate: data.rate,
        location: data.location,
      },
    });

    console.log(
      `Seeded community rate ${data.base.code} -> ${data.quote.code} (${data.location}): ${result.rate.toString()}`,
    );
    created.push(result);
  }

  return created;
}