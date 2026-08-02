import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { metricsMiddleware } from "./middlewares/metrics.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import { requestLogger } from "./middlewares/request-logger.middleware.js";
import { apiRoutes } from "./routes/index.js";
import { checkDatabaseConnection } from "./utils/health-check.util.js";
import { metricsRegistry } from "./utils/metrics.js";

/**
 * Express application instance.
 *
 * This file configures the core middleware stack, security headers,
 * routing, and error handling for the application.
 */
const app = express();

/*
|--------------------------------------------------------------------------
| Global Middlewares
|--------------------------------------------------------------------------
*/

// Log incoming HTTP requests using Pino
app.use(requestLogger);

// Record HTTP request count and duration metrics for every request,
// exposed later via GET /metrics for Prometheus scraping. Placed
// early in the stack so it captures the full request lifecycle,
// including time spent in later middleware.
app.use(metricsMiddleware);

// Secure Express apps by setting various HTTP headers
app.use(helmet());

// Enable Cross-Origin Resource Sharing based on environment config
app.use(
  cors({
    origin: env.CORS_ORIGIN,
  }),
);

// Compress response bodies for all requests
app.use(compression());

// Parse incoming JSON payloads
app.use(express.json());

// Parse incoming URL-encoded payloads
app.use(express.urlencoded({ extended: true }));

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

/**
 * Liveness check.
 *
 * Confirms the process is up and responding at all, with no
 * dependency checks. Used by container orchestrators to decide
 * whether to restart the container — should stay fast and simple.
 */
app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    service: env.APP_NAME,
    version: env.APP_VERSION,
  });
});

/**
 * Readiness check.
 *
 * Confirms the service can actually serve traffic that depends on
 * the database. Returns 503 if the database is unreachable, so load
 * balancers/orchestrators can route traffic away from this instance
 * until it recovers.
 */
app.get("/health/ready", async (_, res) => {
  const databaseConnected = await checkDatabaseConnection();

  const status = databaseConnected ? "ok" : "unavailable";
  const statusCode = databaseConnected ? 200 : 503;

  res.status(statusCode).json({
    status,
    service: env.APP_NAME,
    version: env.APP_VERSION,
    checks: {
      database: databaseConnected ? "ok" : "unreachable",
    },
  });
});

/*
|--------------------------------------------------------------------------
| Metrics
|--------------------------------------------------------------------------
*/

/**
 * Prometheus metrics endpoint.
 *
 * Exposes HTTP request counts/durations (via metricsMiddleware),
 * default Node.js process metrics (memory, CPU, event loop lag, GC —
 * collected automatically by prom-client), and business metrics like
 * FX sync outcomes, in the Prometheus text exposition format.
 *
 * Not versioned under /api/v1 since it's an operational endpoint for
 * infrastructure tooling, not a business API — matching the
 * convention most Prometheus setups expect (/metrics at the root).
 */
app.get("/metrics", async (_, res) => {
  res.set("Content-Type", metricsRegistry.contentType);
  res.send(await metricsRegistry.metrics());
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Versioned API routes (see master spec section 15: /api/v1/...)
app.use("/api/v1", apiRoutes);

/*
|--------------------------------------------------------------------------
| Error Handling
|--------------------------------------------------------------------------
*/

// Catch-all route handler for unmatched endpoints
app.use(notFoundMiddleware);

// Global error handling middleware
app.use(errorMiddleware);

export default app;