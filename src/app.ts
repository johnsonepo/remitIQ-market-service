import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { notFoundMiddleware } from './middlewares/not-found.middleware.js';
import { requestLogger } from './middlewares/request-logger.middleware.js';

const app = express();

/*
|--------------------------------------------------------------------------
| Global Middlewares
|--------------------------------------------------------------------------
*/

app.use(requestLogger);

app.use(helmet());

app.use(
  cors({
    origin: env.CORS_ORIGIN,
  }),
);

app.use(compression());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    service: env.APP_NAME,
    version: env.APP_VERSION,
  });
});

/*
|--------------------------------------------------------------------------
| Error Handling
|--------------------------------------------------------------------------
*/

app.use(notFoundMiddleware);

app.use(errorMiddleware);

export default app;