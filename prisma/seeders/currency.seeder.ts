import { prisma } from '../../src/clients/prisma.client.js';
import type { CurrencyModel } from '../../generated/prisma/models/Currency.js';

/**
 * Currencies tracked by the system.
 *
 * XAF is the primary destination currency for remittances (per the
 * master spec's examples: USD → XAF, EUR → XAF, GBP → XAF). AED is
 * included to support the UAE migrant-worker corridor.
 */
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
] as const;

/**
 * Seeds or updates the set of tracked currencies.
 *
 * Uses `upsert` keyed on the unique `code` field, so this is safe to
 * re-run repeatedly without creating duplicate rows or overwriting
 * manually-edited fields (the `update: {}` clause is a no-op on
 * existing rows).
 *
 * @returns The list of seeded/updated Currency records, in the same
 *          order as the CURRENCIES list above. Callers (e.g. other
 *          seeders) rely on this list to look up currencies by code.
 */
export async function seedCurrencies(): Promise<CurrencyModel[]> {
  const currencies = await Promise.all(
    CURRENCIES.map((currency) =>
      prisma.currency.upsert({
        where: { code: currency.code },
        update: {},
        create: currency,
      }),
    ),
  );

  console.log(`Seeded ${currencies.length} currencies.`);
  return currencies;
}