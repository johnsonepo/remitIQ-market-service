import cron from 'node-cron';

import { runFxSync } from './fx-sync.job.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Schedules the FX Synchronization job to run daily at 01:00 UTC,
 * matching ExchangeRate-API's free-tier daily update cadence (no
 * point polling more often than the upstream data actually changes).
 *
 * Also runs once immediately on startup in non-development
 * environments, so a restart/deploy doesn't leave rates stale for up
 * to 24h until the next scheduled run. Skipped in development since
 * tsx watch restarts the process on every file save, which would
 * otherwise trigger a live API call and DB write on every save.
 */
export function startFxSyncScheduler(): void {
  cron.schedule('0 1 * * *', () => {
    runFxSync().catch((error) => {
      logger.error({ err: error }, 'FX Synchronization: unhandled error in scheduled run');
    });
  });

  logger.info('FX Synchronization: scheduler started (daily at 01:00 UTC)');

  if (env.NODE_ENV !== 'development') {
    runFxSync().catch((error) => {
      logger.error({ err: error }, 'FX Synchronization: unhandled error in startup run');
    });
  } else {
    logger.info('FX Synchronization: skipping immediate startup run in development');
  }
}