import type { Request, Response } from 'express';

import { currencyRepository } from '../repositories/currency.repository.js';
import { exchangeRateHistoryRepository } from '../repositories/exchange-rate-history.repository.js';
import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';

async function resolveCurrencyOrFail(code: string) {
  const currency = await currencyRepository.findByCode(code.toUpperCase());
  if (!currency) {
    throw ApiError.notFound(`Currency with code "${code}" not found`);
  }
  return currency;
}

/**
 * Handlers for historical rate endpoints.
 */
export const exchangeRateHistoryController = {
  /**
   * GET /api/v1/rates/:base/:quote/history?days=30
   *
   * Returns historical rate snapshots for a currency pair, oldest
   * first, over the requested lookback window (default 30 days,
   * max 365).
   */
  async getHistory(
    req: Request<{ base: string; quote: string }>,
    res: Response,
  ): Promise<void> {
    const { base, quote } = req.params;

    const daysParam = req.query.days;
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

    ApiResponse.send(res, 200, history, 'Rate history fetched');
  },
};