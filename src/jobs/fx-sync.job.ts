import { fetchLatestRates } from '../clients/exchange-rate-api.client.js';
import { currencyRepository } from '../repositories/currency.repository.js';
import { providerRepository } from '../repositories/provider.repository.js';
import { exchangeRateRepository } from '../repositories/exchange-rate.repository.js';
import { exchangeRateHistoryRepository } from '../repositories/exchange-rate-history.repository.js';
import { prisma } from '../clients/prisma.client.js';
import { logger } from '../utils/logger.js';

/** Number of times to retry a failed fetch before giving up on a provider. */
const MAX_RETRIES = 3;

/** Base delay in ms between retries; doubled on each attempt (exponential backoff). */
const RETRY_BASE_DELAY_MS = 1_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches rates for a base currency with retry + exponential backoff.
 *
 * @param baseCode - ISO currency code to fetch rates for.
 * @returns The conversion rates map on success.
 * @throws The last encountered error if all retries are exhausted.
 */
async function fetchWithRetry(baseCode: string): Promise<Record<string, number>> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fetchLatestRates(baseCode);
    } catch (error) {
      lastError = error;
      logger.warn(
        { baseCode, attempt, maxRetries: MAX_RETRIES },
        'FX fetch attempt failed, will retry if attempts remain',
      );

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      }
    }
  }

  throw lastError;
}

/**
 * Runs one full FX synchronization pass:
 *
 * 1. Loads all active currencies and the primary active provider.
 * 2. For each non-XAF currency, fetches the live rate against XAF
 *    (XAF being the primary destination currency per the master spec).
 * 3. Upserts the current rate into ExchangeRate.
 * 4. Appends a snapshot into ExchangeRateHistory for trend analysis.
 *
 * Failures for an individual currency are logged and skipped, so one
 * bad rate doesn't abort the whole sync run.
 */
export async function runFxSync(): Promise<void> {
  const startedAt = Date.now();
  logger.info('FX Synchronization: starting sync run');

  const [currencies, providers] = await Promise.all([
    currencyRepository.findActive(),
    providerRepository.findActive(),
  ]);

  const provider = providers[0];

  if (!provider) {
    logger.error('FX Synchronization: no active provider configured, aborting sync run');
    return;
  }

  const xaf = currencies.find((c) => c.code === 'XAF');

  if (!xaf) {
    logger.error('FX Synchronization: XAF currency not found, aborting sync run');
    return;
  }

  let successCount = 0;
  let failureCount = 0;

  for (const currency of currencies) {
    if (currency.code === 'XAF') continue;

    try {
      const conversionRates = await fetchWithRetry(currency.code);
      const rateToXaf = conversionRates.XAF;

      if (rateToXaf === undefined) {
        logger.warn(
          { currency: currency.code },
          'FX Synchronization: XAF rate missing from provider response, skipping',
        );
        failureCount++;
        continue;
      }

      // Upsert current rate + append history in a single transaction,
      // so the two never fall out of sync with each other.
      await prisma.$transaction([
        prisma.exchangeRate.upsert({
          where: {
            baseCurrencyId_quoteCurrencyId_providerId: {
              baseCurrencyId: currency.id,
              quoteCurrencyId: xaf.id,
              providerId: provider.id,
            },
          },
          update: { rate: rateToXaf, fetchedAt: new Date() },
          create: {
            baseCurrencyId: currency.id,
            quoteCurrencyId: xaf.id,
            providerId: provider.id,
            rate: rateToXaf,
          },
        }),
        prisma.exchangeRateHistory.create({
          data: {
            baseCurrencyId: currency.id,
            quoteCurrencyId: xaf.id,
            providerId: provider.id,
            rate: rateToXaf,
          },
        }),
      ]);

      logger.info({ pair: `${currency.code} -> XAF`, rate: rateToXaf }, 'FX Synchronization: rate updated');
      successCount++;
    } catch (error) {
      logger.error(
        { err: error, currency: currency.code },
        'FX Synchronization: failed to sync rate after all retries',
      );
      failureCount++;
    }
  }

  const durationMs = Date.now() - startedAt;
  logger.info(
    { successCount, failureCount, durationMs },
    'FX Synchronization: sync run complete',
  );
}