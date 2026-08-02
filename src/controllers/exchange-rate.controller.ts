import type { Request, Response } from 'express';

import { currencyRepository } from '../repositories/currency.repository.js';
import { exchangeRateRepository } from '../repositories/exchange-rate.repository.js';
import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';
import type { Currency } from '../../generated/prisma/client.js';

/**
 * Resolves a currency code (e.g. "usd") to its Currency record,
 * throwing a 404 ApiError if it doesn't exist.
 */
async function resolveCurrencyOrFail(code: string): Promise<Currency> {
  const currency = await currencyRepository.findByCode(code.toUpperCase());

  if (!currency) {
    throw ApiError.notFound(`Currency with code "${code}" not found`);
  }

  return currency;
}

/**
 * Handlers for exchange rate endpoints.
 */
export const exchangeRateController = {
  /**
   * GET /api/v1/rates
   *
   * Lists all current exchange rates across all pairs and providers.
   */
  async list(_req: Request, res: Response): Promise<void> {
    const rates = await exchangeRateRepository.findAllWithDetails();
    ApiResponse.send(res, 200, rates, 'Exchange rates fetched');
  },

  /**
   * GET /api/v1/rates/:base/:quote
   *
   * Lists all current rates for a currency pair, across all
   * providers, ordered by provider priority.
   *
   * Example: GET /api/v1/rates/USD/XAF
   */
  async getPair(req: Request<{ base: string; quote: string }>, res: Response): Promise<void> {
    const { base, quote } = req.params;

    if (!base || !quote) {
      throw ApiError.badRequest('Base and quote currencies are required');
    }

    const baseCurrency = await resolveCurrencyOrFail(base);
    const quoteCurrency = await resolveCurrencyOrFail(quote);

    const rates = await exchangeRateRepository.findByPair(baseCurrency.id, quoteCurrency.id);

    if (rates.length === 0) {
      throw ApiError.notFound(
        `No exchange rate found for ${baseCurrency.code} -> ${quoteCurrency.code}`,
      );
    }

    ApiResponse.send(res, 200, rates, 'Exchange rates fetched');
  },

  /**
   * GET /api/v1/rates/:base/:quote/latest
   *
   * Returns the single most-preferred current rate for a currency
   * pair (from the active provider with the lowest priority value).
   *
   * Example: GET /api/v1/rates/USD/XAF/latest
   */
  async getLatestForPair(req: Request<{ base: string; quote: string }>, res: Response): Promise<void> {
    const { base, quote } = req.params;

    if (!base || !quote) {
      throw ApiError.badRequest('Base and quote currencies are required');
    }

    const baseCurrency = await resolveCurrencyOrFail(base);
    const quoteCurrency = await resolveCurrencyOrFail(quote);

    const rate = await exchangeRateRepository.findLatestForPair(baseCurrency.id, quoteCurrency.id);

    if (!rate) {
      throw ApiError.notFound(
        `No exchange rate found for ${baseCurrency.code} -> ${quoteCurrency.code}`,
      );
    }

    ApiResponse.send(res, 200, rate, 'Latest exchange rate fetched');
  },
};