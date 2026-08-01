import axios from 'axios';

import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Response shape from ExchangeRate-API's v6 /latest endpoint.
 * See: https://www.exchangerate-api.com/docs/standard-requests
 */
interface ExchangeRateApiResponse {
  result: string;
  base_code: string;
  time_last_update_utc: string;
  conversion_rates: Record<string, number>;
}

/**
 * Fetches the latest exchange rates for a given base currency from
 * ExchangeRate-API's v6 Standard endpoint.
 *
 * @param baseCurrencyCode - ISO 4217 code, e.g. "USD".
 * @returns A map of currency code -> rate relative to the base currency.
 * @throws Error if the API key is missing, the request fails, or the
 *         API reports a non-success result.
 */
export async function fetchLatestRates(
  baseCurrencyCode: string,
): Promise<Record<string, number>> {
  if (!env.FX_API_KEY) {
    throw new Error('FX_API_KEY is not configured; cannot fetch live rates.');
  }

  const url = `${env.FX_API_URL}/${env.FX_API_KEY}/latest/${baseCurrencyCode}`;

  try {
    const response = await axios.get<ExchangeRateApiResponse>(url, { timeout: 10_000 });

    if (response.data.result !== 'success') {
      throw new Error(
        `ExchangeRate-API returned non-success result for ${baseCurrencyCode}: ${response.data.result}`,
      );
    }

    return response.data.conversion_rates;
  } catch (error) {
    logger.error(
      { err: error, baseCurrencyCode },
      'Failed to fetch rates from ExchangeRate-API',
    );
    throw error;
  }
}