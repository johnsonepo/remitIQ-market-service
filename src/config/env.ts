import "dotenv/config";

import { z } from "zod";

/**
 * Application environment schema.
 *
 * Every environment variable required by the application
 * must be declared and validated here.
 *
 * This file is the single source of truth for configuration.
 */
const envSchema = z.object({
  /*
   |--------------------------------------------------------------------------
   | Application
   |--------------------------------------------------------------------------
   */

  NODE_ENV: z.enum(["development", "test", "production"]),

  PORT: z.coerce.number().int().positive(),

  APP_NAME: z.string().min(1),

  APP_VERSION: z.string().min(1),

  /*
   |--------------------------------------------------------------------------
   | Database
   |--------------------------------------------------------------------------
   */

  DATABASE_URL: z.url(),

  /*
   |--------------------------------------------------------------------------
   | Logging
   |--------------------------------------------------------------------------
   */

  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]),

  /*
   |--------------------------------------------------------------------------
   | External Services
   |--------------------------------------------------------------------------
   */

  FX_API_URL: z.url(),

  FX_API_KEY: z.string().optional(),

  /*
   |--------------------------------------------------------------------------
   | Security
   |--------------------------------------------------------------------------
   */

  JWT_SECRET: z.string().min(16),

  /*
   |--------------------------------------------------------------------------
   | CORS
   |--------------------------------------------------------------------------
   */

  CORS_ORIGIN: z.url(),
});

/**
 * Validate environment variables.
 *
 * If validation fails the application
 * will stop immediately.
 */
export const env = envSchema.parse(process.env);
