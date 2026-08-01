import { prisma } from '../clients/prisma.client.js';
import { BaseRepository } from './base.repository.js';
import type { Prisma } from '../generated/prisma/client.js';

// Define a type for CommunityRate that includes the related currency models fetched via `include`
export type CommunityRateWithDetails = Prisma.CommunityRateGetPayload<{
  include: {
    baseCurrency: true;
    quoteCurrency: true;
  };
}>;

/**
 * Repository for CommunityRate records (user-submitted parallel/
 * street-market rate observations).
 */
export class CommunityRateRepository extends BaseRepository<typeof prisma.communityRate> {
  protected readonly model = prisma.communityRate;

  /**
   * Lists community-submitted rates for a currency pair, most recent
   * first, optionally limited to a lookback window.
   *
   * @param baseCurrencyId - ID of the base currency.
   * @param quoteCurrencyId - ID of the quote currency.
   * @param sinceDays - Only include submissions from the last N days
   *                    (default 30).
   */
  findByPair(
    baseCurrencyId: string,
    quoteCurrencyId: string,
    sinceDays = 30,
  ): Promise<CommunityRateWithDetails[]> {
    const since = new Date();
    since.setDate(since.getDate() - sinceDays);

    return this.model.findMany({
      where: {
        baseCurrencyId,
        quoteCurrencyId,
        submittedAt: { gte: since },
      },
      include: { baseCurrency: true, quoteCurrency: true },
      orderBy: { submittedAt: 'desc' },
    });
  }

  /**
   * Finds the single most recent community rate submission for a pair.
   */
  findLatestForPair(
    baseCurrencyId: string,
    quoteCurrencyId: string,
  ): Promise<CommunityRateWithDetails | null> {
    return this.model.findFirst({
      where: { baseCurrencyId, quoteCurrencyId },
      include: { baseCurrency: true, quoteCurrency: true },
      orderBy: { submittedAt: 'desc' },
    });
  }
}

export const communityRateRepository = new CommunityRateRepository();