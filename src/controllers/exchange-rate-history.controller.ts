import type { Request, Response } from 'express';

import { currencyRepository } from '../repositories/currency.repository.js';
import { exchangeRateHistoryRepository } from '../repositories/exchange-rate-history.repository.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';

/**
 * Concrete Currency model returned by the repository.
 */
type Currency = NonNullable<
  Awaited<ReturnType<typeof currencyRepository.findByCode>>
>;

/**
 * Resolves a currency by ISO code or throws a 404 error.
 *
 * @param code - ISO currency code (e.g. USD, XAF).
 * @returns The resolved Currency.
 * @throws ApiError.notFound if the currency does not exist.
 */
async function resolveCurrencyOrFail(
  code: string,
): Promise<Currency> {
  const currency = await currencyRepository.findByCode(code.toUpperCase());

  if (!currency) {
    throw ApiError.notFound(`Currency with code "${code}" not found`);
  }

  return currency;
}

/**
 * Handlers for historical exchange-rate endpoints.
 */
export const exchangeRateHistoryController = {
  /**
   * GET /api/v1/rates/:base/:quote/history?days=30
   *
   * Returns historical exchange-rate snapshots for a currency pair,
   * ordered chronologically (oldest first).
   *
   * Query parameters:
   * - days (optional): Number of days to look back.
   *   Defaults to 30 and is capped at 365.
   */
  async getHistory(
    req: Request<{ base: string; quote: string }>,
    res: Response,
  ): Promise<void> {
    const { base, quote } = req.params;

    const daysParam = req.query.days as string | undefined;
    const days = daysParam ? Math.min(Number(daysParam), 365) : 30;

    if (Number.isNaN(days) || days <= 0) {
      throw ApiError.badRequest('days must be a positive number');
    }

    const baseCurrency = await resolveCurrencyOrFail(base);
    const quoteCurrency = await resolveCurrencyOrFail(quote);

    const history = await exchangeRateHistoryRepository.findByPairSince(
      baseCurrency.id,
      quoteCurrency.id,
      days,
    );

    ApiResponse.send(
      res,
      200,
      history,
      'Rate history fetched',
    );
  },
};