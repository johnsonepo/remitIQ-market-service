import type { Request, Response } from 'express';

import { findBestRate } from '../services/rate-comparison.service.js';
import { ApiResponse } from '../utils/api-response.js';

/**
 * Handlers for rate-comparison endpoints — combining official and
 * community-submitted rates to surface the most favorable rate for
 * a currency pair.
 */
export const rateComparisonController = {
  /**
   * GET /api/v1/best-rate/:base/:quote
   *
   * Returns the most favorable current rate for a pair, comparing
   * the official API rate against the latest community-submitted
   * rate, per findBestRate.
   */
  async getBest(req: Request<{ base: string; quote: string }>, res: Response): Promise<void> {
    const { base, quote } = req.params;

    const result = await findBestRate(base, quote);

    ApiResponse.send(res, 200, result, 'Best exchange rate fetched');
  },
};