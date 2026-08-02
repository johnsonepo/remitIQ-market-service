import { fetchLatestRates } from '../clients/exchange-rate-api.client.js';
import { currencyRepository } from '../repositories/currency.repository.js';
import { providerRepository } from '../repositories/provider.repository.js';
import { prisma } from '../clients/prisma.client.js';
import { logger } from '../utils/logger.js';
import { fxSyncCounter } from '../utils/metrics.js';

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1_000;

/**
 * Shape of the last FX sync run's outcome, exposed via
 * GET /api/v1/sync/status for monitoring purposes.
 */
export interface FxSyncStatus {
  lastRunAt: Date | null;
  lastRunDurationMs: number | null;
  lastRunSuccessCount: number;
  lastRunFailureCount: number;
  lastRunFailedCurrencies: string[];
  lastError: string | null;
  isRunning: boolean;
}

/**
 * In-memory tracker for the most recent sync run. Resets on process
 * restart. For a single-instance deployment this is sufficient;
 * a multi-instance deployment would need this persisted centrally
 * (e.g. in the database or a shared cache) instead.
 */
const status: FxSyncStatus = {
  lastRunAt: null,
  lastRunDurationMs: null,
  lastRunSuccessCount: 0,
  lastRunFailureCount: 0,
  lastRunFailedCurrencies: [],
  lastError: null,
  isRunning: false,
};

/**
 * Returns a snapshot of the most recent FX sync run's outcome.
 */
export function getFxSyncStatus(): FxSyncStatus {
  return { ...status };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
 * Runs one full FX synchronization pass. See getFxSyncStatus() for
 * how to check the outcome of the most recent run.
 */
export async function runFxSync(): Promise<void> {
  const startedAt = Date.now();
  status.isRunning = true;
  logger.info('FX Synchronization: starting sync run');

  const failedCurrencies: string[] = [];
  let successCount = 0;
  let failureCount = 0;

  try {
    const [currencies, providers] = await Promise.all([
      currencyRepository.findActive(),
      providerRepository.findActive(),
    ]);

    const provider = providers[0];

    if (!provider) {
      throw new Error('No active provider configured');
    }

    const xaf = currencies.find((c) => c.code === 'XAF');

    if (!xaf) {
      throw new Error('XAF currency not found');
    }

    for (const currency of currencies) {
      if (currency.code === 'XAF') continue;

      try {
        const conversionRates = await fetchWithRetry(currency.code);
        const rateToXaf = conversionRates.XAF;

        if (rateToXaf === undefined) {
          logger.warn({ currency: currency.code }, 'FX Synchronization: XAF rate missing, skipping');
          failureCount++;
          failedCurrencies.push(currency.code);
          fxSyncCounter.inc({ currency: currency.code, result: 'failure' });
          continue;
        }

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
        fxSyncCounter.inc({ currency: currency.code, result: 'success' });
      } catch (error) {
        logger.error({ err: error, currency: currency.code }, 'FX Synchronization: failed after all retries');
        failureCount++;
        failedCurrencies.push(currency.code);
        fxSyncCounter.inc({ currency: currency.code, result: 'failure' });
      }
    }

    status.lastError = null;
  } catch (error) {
    logger.error({ err: error }, 'FX Synchronization: sync run aborted');
    status.lastError = error instanceof Error ? error.message : String(error);
  } finally {
    const durationMs = Date.now() - startedAt;

    status.lastRunAt = new Date();
    status.lastRunDurationMs = durationMs;
    status.lastRunSuccessCount = successCount;
    status.lastRunFailureCount = failureCount;
    status.lastRunFailedCurrencies = failedCurrencies;
    status.isRunning = false;

    logger.info({ successCount, failureCount, durationMs }, 'FX Synchronization: sync run complete');
  }
}