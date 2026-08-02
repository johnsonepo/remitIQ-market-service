import { prisma } from '../clients/prisma.client.js';
import { BaseRepository } from './base.repository.js';

/**
 * Repository for ExchangeRateHistory records — append-only rate
 * snapshots accumulated by the FX Synchronization job, used for
 * trend analysis over time.
 */
export class ExchangeRateHistoryRepository extends BaseRepository<
  typeof prisma.exchangeRateHistory
> {
  protected readonly model = prisma.exchangeRateHistory;

  /**
   * Lists historical rate snapshots for a currency pair within a
   * lookback window, oldest first (chronological order, suitable for
   * charting).
   *
   * @param baseCurrencyId - ID of the base currency.
   * @param quoteCurrencyId - ID of the quote currency.
   * @param sinceDays - How many days back to include (default 30).
   */
  findByPairSince(
    baseCurrencyId: string,
    quoteCurrencyId: string,
    sinceDays = 30,
  ): ReturnType<typeof prisma.exchangeRateHistory.findMany> {
    const since = new Date();
    since.setDate(since.getDate() - sinceDays);

    return this.model.findMany({
      where: {
        baseCurrencyId,
        quoteCurrencyId,
        recordedAt: {
          gte: since,
        },
      },
      orderBy: {
        recordedAt: 'asc',
      },
    });
  }
}

export const exchangeRateHistoryRepository =
  new ExchangeRateHistoryRepository();