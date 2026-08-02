import { Router } from 'express';

import { exchangeRateController } from '../controllers/exchange-rate.controller.js';
import { exchangeRateHistoryController } from '../controllers/exchange-rate-history.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.get('/', asyncHandler(exchangeRateController.list));
router.get('/:base/:quote/latest', asyncHandler(exchangeRateController.getLatestForPair));
router.get('/:base/:quote/history', asyncHandler(exchangeRateHistoryController.getHistory));
router.get('/:base/:quote', asyncHandler(exchangeRateController.getPair));

export { router as exchangeRateRoutes };