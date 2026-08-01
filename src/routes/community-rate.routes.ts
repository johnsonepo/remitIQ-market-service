import { Router } from 'express';

import { communityRateController } from '../controllers/community-rate.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { submitCommunityRateSchema } from '../validators/community-rate.validator.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.post(
  '/',
  validate({ body: submitCommunityRateSchema }),
  asyncHandler(communityRateController.submit),
);
router.get('/:base/:quote', asyncHandler(communityRateController.getPair));

export { router as communityRateRoutes };