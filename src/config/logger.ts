import { env } from "./env.js";

/**
 * Logger configuration.
 *
 * This file defines the application's logging settings.
 * The actual Pino logger instance will be created later
 * using these values.
 */
export const loggerConfig = {
  /**
   * Current logging level.
   */
  level: env.LOG_LEVEL,

  /**
   * Pretty-print logs during development.
   */
  pretty: env.NODE_ENV === "development",

  /**
   * Include timestamps in every log entry.
   */
  timestamp: true,
} as const;
