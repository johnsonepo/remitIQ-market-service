import { prisma } from '../clients/prisma.client.js';
import { BaseRepository } from './base.repository.js';
import type { Prisma } from '../generated/prisma/client.js';

// Define a type for ExchangeRate that includes the related models fetched via `include`
export type ExchangeRateWithDetails = Prisma.ExchangeRateGetPayload<{
  include: {
    baseCurrency: true;
    quoteCurrency: true;
    provider: true;
  };
}>;

/**
 * Repository for ExchangeRate records (current official rates,
 * one per base/quote/provider triple).
 */
export class ExchangeRateRepository extends BaseRepository<typeof prisma.exchangeRate> {
  protected readonly model = prisma.exchangeRate;

  /**
   * Finds the current rate(s) for a given base/quote currency pair,
   * across all providers, ordered by provider priority ascending so
   * the most-preferred provider's rate appears first.
   *
   * @param baseCurrencyId - ID of the base currency (e.g. USD's id).
   * @param quoteCurrencyId - ID of the quote currency (e.g. XAF's id).
   * @returns All ExchangeRate records for this pair, with provider
   *          and currency details included.
   */
  findByPair(baseCurrencyId: string, quoteCurrencyId: string): Promise<ExchangeRateWithDetails[]> {
    return this.model.findMany({
      where: { baseCurrencyId, quoteCurrencyId },
      include: {
        baseCurrency: true,
        quoteCurrency: true,
        provider: true,
      },
      orderBy: { provider: { priority: 'asc' } },
    });
  }

  /**
   * Finds the single most-preferred current rate for a pair — i.e.
   * the rate from the active provider with the lowest priority value.
   *
   * @param baseCurrencyId - ID of the base currency.
   * @param quoteCurrencyId - ID of the quote currency.
   * @returns The best-priority ExchangeRate record, or null if none exists.
   */
  findLatestForPair(
    baseCurrencyId: string,
    quoteCurrencyId: string,
  ): Promise<ExchangeRateWithDetails | null> {
    return this.model.findFirst({
      where: {
        baseCurrencyId,
        quoteCurrencyId,
        provider: { isActive: true },
      },
      include: {
        baseCurrency: true,
        quoteCurrency: true,
        provider: true,
      },
      orderBy: { provider: { priority: 'asc' } },
    });
  }

  /**
   * Lists all current rates, with currency and provider details
   * included, for a general overview endpoint.
   */
  findAllWithDetails(): Promise<ExchangeRateWithDetails[]> {
    return this.model.findMany({
      include: {
        baseCurrency: true,
        quoteCurrency: true,
        provider: true,
      },
      orderBy: [{ baseCurrency: { code: 'asc' } }, { provider: { priority: 'asc' } }],
    });
  }
}

export const exchangeRateRepository = new ExchangeRateRepository();