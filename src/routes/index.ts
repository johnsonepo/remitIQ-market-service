import { Router } from 'express';

import { currencyRoutes } from './currency.routes.js';
import { providerRoutes } from './provider.routes.js';
import { exchangeRateRoutes } from './exchange-rate.routes.js';

const router = Router();

router.use('/currencies', currencyRoutes);
router.use('/providers', providerRoutes);
router.use('/rates', exchangeRateRoutes);

export { router as apiRoutes };