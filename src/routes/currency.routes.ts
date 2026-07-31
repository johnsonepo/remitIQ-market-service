import { Router } from 'express';

import { currencyController } from '../controllers/currency.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.get('/', asyncHandler(currencyController.list));
router.get('/:code', asyncHandler(currencyController.getByCode));

export { router as currencyRoutes };