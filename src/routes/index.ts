import { Router } from 'express';

import { currencyRoutes } from './currency.routes.js';
import { providerRoutes } from './provider.routes.js';
import { exchangeRateRoutes } from './exchange-rate.routes.js';
import { communityRateRoutes } from './community-rate.routes.js';
import { rateComparisonRoutes } from './rate-comparison.routes.js';
import { syncStatusRoutes } from './sync-status.routes.js';
import { alertRuleRoutes } from './alert-rule.routes.js';


const router = Router();

router.use('/currencies', currencyRoutes);
router.use('/providers', providerRoutes);
router.use('/rates', exchangeRateRoutes);
router.use('/community-rates', communityRateRoutes);
router.use('/best-rate', rateComparisonRoutes);
router.use('/sync', syncStatusRoutes);
router.use('/alert-rules', alertRuleRoutes);

export { router as apiRoutes };