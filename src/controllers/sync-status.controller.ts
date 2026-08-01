import type { Request, Response } from 'express';

import { getFxSyncStatus, runFxSync } from '../jobs/fx-sync.job.js';
import { ApiResponse } from '../utils/api-response.js';
import { logger } from '../utils/logger.js';

/**
 * Handlers for job monitoring endpoints. Kept independent of the
 * fx-sync job internals — reads its exposed status snapshot and can
 * trigger a run, but doesn't duplicate the job's own logic.
 */
export const syncStatusController = {
  /**
   * GET /api/v1/sync/status
   *
   * Returns the outcome of the most recent FX Synchronization run.
   */
  async getStatus(_req: Request, res: Response): Promise<void> {
    const status = getFxSyncStatus();

    ApiResponse.send(res, 200, status, 'FX sync status fetched');
  },

  /**
   * POST /api/v1/sync/trigger
   *
   * Manually triggers an FX sync run. Does not wait for completion —
   * responds immediately, since the sync runs in the background.
   * Useful for testing, or for administrators forcing a fresh sync
   * on demand.
   */
  async trigger(_req: Request, res: Response): Promise<void> {
    runFxSync().catch((error) => {
      logger.error({ err: error }, 'FX Synchronization: unhandled error in manually triggered run');
    });

    ApiResponse.send(res, 202, null, 'FX sync triggered');
  },
};