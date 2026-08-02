import type { Request, Response } from 'express';

import { currencyRepository } from '../repositories/currency.repository.js';
import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';

/**
 * Handlers for currency-related endpoints.
 */
export const currencyController = {
  /**
   * GET /api/v1/currencies
   *
   * Lists all currencies. Supports an optional `?active=true` query
   * param to filter to active currencies only.
   */
  async list(req: Request, res: Response): Promise<void> {
    const activeOnly = req.query.active === 'true';

    const currencies = activeOnly
      ? await currencyRepository.findActive()
      : await currencyRepository.findMany();

    ApiResponse.send(res, 200, currencies, 'Currencies fetched');
  },

  /**
   * GET /api/v1/currencies/:code
   *
   * Fetches a single currency by its ISO 4217 code (e.g. "USD").
   * Throws a 404 ApiError if no matching currency exists.
   */
  async getByCode(req: Request<{ code: string }>, res: Response): Promise<void> {
    const { code } = req.params;

    const currency = await currencyRepository.findByCode(code.toUpperCase());

    if (!currency) {
      throw ApiError.notFound(`Currency with code "${code}" not found`);
    }

    ApiResponse.send(res, 200, currency, 'Currency fetched');
  },
};