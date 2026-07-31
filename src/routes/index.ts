import { Router } from 'express';

import { currencyRoutes } from './currency.routes.js';

const router = Router();

router.use('/currencies', currencyRoutes);

export { router as apiRoutes };