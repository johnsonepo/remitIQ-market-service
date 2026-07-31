import { Router } from 'express';

import { providerController } from '../controllers/provider.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.get('/', asyncHandler(providerController.list));
router.get('/:name', asyncHandler(providerController.getByName));

export { router as providerRoutes };