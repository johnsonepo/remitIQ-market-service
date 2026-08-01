import { currencyRepository } from '../repositories/currency.repository.js';
import { exchangeRateRepository } from '../repositories/exchange-rate.repository.js';
import { communityRateRepository } from '../repositories/community-rate.repository.js';
import { ApiError } from '../utils/api-error.js';

/**
 * Shape of the "best rate" comparison result returned to clients.
 */
export interface BestRateResult {
  rate: number;
  source: 'official' | 'community';
  providerName?: string;
  location?: string | null;
  submittedAt?: Date;
  fetchedAt?: Date;
  comparedTo: {
    official: { rate: number; provider: string } | null;
    community: { rate: number; location: string | null } | null;
  };
}

/**
 * Determines the best available exchange rate for a currency pair by
 * comparing the current official rate (from active providers) against
 * the most recent community-submitted rate.
 *
 * "Best" is defined as the higher rate — since ExchangeRate/CommunityRate
 * are stored as base -> quote (e.g. USD -> XAF), a higher rate means
 * more destination currency per unit of base currency sent, which is
 * more favorable to the sender.
 *
 * This directly supports the master spec's core question: "Is today a
 * good day to send money?"
 *
 * @param baseCode - ISO currency code of the base currency (e.g. "USD").
 * @param quoteCode - ISO currency code of the quote currency (e.g. "XAF").
 * @returns The best rate, with details on what it was compared against.
 * @throws ApiError.notFound if either currency code is invalid, or if
 *         neither an official nor a community rate exists for the pair.
 */
export async function findBestRate(baseCode: string, quoteCode: string): Promise<BestRateResult> {
  const baseCurrency = await currencyRepository.findByCode(baseCode.toUpperCase());
  if (!baseCurrency) {
    throw ApiError.notFound(`Currency with code "${baseCode}" not found`);
  }

  const quoteCurrency = await currencyRepository.findByCode(quoteCode.toUpperCase());
  if (!quoteCurrency) {
    throw ApiError.notFound(`Currency with code "${quoteCode}" not found`);
  }

  const [officialRate, communityRate] = await Promise.all([
    exchangeRateRepository.findLatestForPair(baseCurrency.id, quoteCurrency.id),
    communityRateRepository.findLatestForPair(baseCurrency.id, quoteCurrency.id),
  ]);

  if (!officialRate && !communityRate) {
    throw ApiError.notFound(
      `No exchange rate available for ${baseCurrency.code} -> ${quoteCurrency.code}`,
    );
  }

  const officialValue = officialRate ? Number(officialRate.rate) : null;
  const communityValue = communityRate ? Number(communityRate.rate) : null;

  const comparedTo: BestRateResult['comparedTo'] = {
    official: officialRate
      ? { rate: officialValue!, provider: officialRate.provider.name }
      : null,
    community: communityRate
      ? { rate: communityValue!, location: communityRate.location }
      : null,
  };

  // Only one source available -> that's the best rate by default.
  if (officialValue !== null && communityValue === null) {
    return {
      rate: officialValue,
      source: 'official',
      providerName: officialRate!.provider.name,
      fetchedAt: officialRate!.fetchedAt,
      comparedTo,
    };
  }

  if (communityValue !== null && officialValue === null) {
    return {
      rate: communityValue,
      source: 'community',
      location: communityRate!.location,
      submittedAt: communityRate!.submittedAt,
      comparedTo,
    };
  }

  // Both available -> pick the higher (more favorable to the sender).
  if (communityValue! > officialValue!) {
    return {
      rate: communityValue!,
      source: 'community',
      location: communityRate!.location,
      submittedAt: communityRate!.submittedAt,
      comparedTo,
    };
  }

  return {
    rate: officialValue!,
    source: 'official',
    providerName: officialRate!.provider.name,
    fetchedAt: officialRate!.fetchedAt,
    comparedTo,
  };
}