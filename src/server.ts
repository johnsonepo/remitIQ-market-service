import app from "./app.js";
import { env } from "./config/index.js";
import { logger } from "./utils/logger.js";

/**
 * Start the Express application.
 *
 * Binds the server to the configured port and logs
 * a startup message once the server is successfully listening.
 */
app.listen(env.PORT, () => {
  logger.info(`${env.APP_NAME} listening on port ${env.PORT}`);
});
