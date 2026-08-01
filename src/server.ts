import app from "./app.js";
import { env } from "./config/index.js";
import { logger } from "./utils/logger.js";
import { startFxSyncScheduler } from "./jobs/fx-sync.scheduler.js";

/**
 * Start the Express application.
 *
 * Binds the server to the configured port and logs
 * a startup message once the server is successfully listening.
 */
app.listen(env.PORT, () => {
  logger.info(`${env.APP_NAME} listening on port ${env.PORT}`);

  // Start scheduled background jobs once the server is confirmed
  // listening, so job-related errors don't block the HTTP server
  // from coming up.
  startFxSyncScheduler();
});