import app from './app.js';
import { env } from './config/index.js';
import { logger } from './utils/logger.js';

app.listen(env.PORT, () => {
  logger.info(
    `${env.APP_NAME} listening on port ${env.PORT}`,
  );
});