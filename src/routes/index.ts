import { Router } from 'express';

import { currencyRoutes } from './currency.routes.js';
import { providerRoutes } from './provider.routes.js';

const router = Router();

router.use('/currencies', currencyRoutes);
router.use('/providers', providerRoutes);

export { router as apiRoutes };