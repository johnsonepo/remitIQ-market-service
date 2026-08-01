import { Router } from 'express';

import { rateComparisonController } from '../controllers/rate-comparison.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * Routes for rate-comparison endpoints. Mounted independently at
 * /api/v1/best-rate — kept fully separate from both the Exchange
 * Rate and Community Rate modules, since this module reads from both
 * but belongs to neither.
 */
const router = Router();

router.get('/:base/:quote', asyncHandler(rateComparisonController.getBest));

export { router as rateComparisonRoutes };