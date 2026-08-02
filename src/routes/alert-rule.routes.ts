import { Router } from 'express';

import { alertRuleController } from '../controllers/alert-rule.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createAlertRuleSchema } from '../validators/alert-rule.validator.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.post('/', validate({ body: createAlertRuleSchema }), asyncHandler(alertRuleController.create));
router.get('/:userId', asyncHandler(alertRuleController.listByUser));
router.get('/:id/events', asyncHandler(alertRuleController.listEvents));
router.delete('/:id', asyncHandler(alertRuleController.remove));

export { router as alertRuleRoutes };