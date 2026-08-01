import { Router } from 'express';

import { syncStatusController } from '../controllers/sync-status.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.get('/status', asyncHandler(syncStatusController.getStatus));
router.post('/trigger', asyncHandler(syncStatusController.trigger));

export { router as syncStatusRoutes };