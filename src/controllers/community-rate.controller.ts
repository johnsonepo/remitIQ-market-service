import type { Request, Response } from 'express';

import { currencyRepository } from '../repositories/currency.repository.js';
import { communityRateRepository } from '../repositories/community-rate.repository.js';
import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';
import type { SubmitCommunityRateInput } from '../validators/community-rate.validator.js';
import type { Currency } from '../../generated/prisma/client.js';

async function resolveCurrencyOrFail(code: string): Promise<Currency> {
  const currency = await currencyRepository.findByCode(code.toUpperCase());
  if (!currency) {
    throw ApiError.notFound(`Currency with code "${code}" not found`);
  }
  return currency;
}

/**
 * Handlers for community-submitted rate endpoints.
 */
export const communityRateController = {
  /**
   * GET /api/v1/community-rates/:base/:quote
   *
   * Lists recent community-submitted rates for a currency pair
   * (default: last 30 days), most recent first.
   */
  async getPair(req: Request<{ base: string; quote: string }>, res: Response): Promise<void> {
    const { base, quote } = req.params;

    if (!base || !quote) {
      throw ApiError.badRequest('Base and quote currencies are required');
    }

    const baseCurrency = await resolveCurrencyOrFail(base);
    const quoteCurrency = await resolveCurrencyOrFail(quote);

    const rates = await communityRateRepository.findByPair(baseCurrency.id, quoteCurrency.id);

    ApiResponse.send(res, 200, rates, 'Community rates fetched');
  },

  /**
   * POST /api/v1/community-rates
   *
   * Submits a new community-reported rate. Body validated by
   * submitCommunityRateSchema via the validate middleware.
   */
  async submit(req: Request, res: Response): Promise<void> {
    const body = req.body as SubmitCommunityRateInput;

    const baseCurrency = await resolveCurrencyOrFail(body.baseCurrencyCode);
    const quoteCurrency = await resolveCurrencyOrFail(body.quoteCurrencyCode);

    const created = await communityRateRepository.create({
      data: {
        userId: body.userId,
        baseCurrencyId: baseCurrency.id,
        quoteCurrencyId: quoteCurrency.id,
        rate: body.rate,
        location: body.location,
      },
    });

    ApiResponse.created(res, created, 'Community rate submitted');
  },
};