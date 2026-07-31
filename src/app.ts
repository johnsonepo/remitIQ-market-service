import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import { requestLogger } from "./middlewares/request-logger.middleware.js";
import { apiRoutes } from "./routes/index.js";

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
 * Health check endpoint.
 *
 * Returns the current status and metadata of the running service.
 */
app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    service: env.APP_NAME,
    version: env.APP_VERSION,
  });
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