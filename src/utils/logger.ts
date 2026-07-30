import pino from 'pino';

import { loggerConfig } from '../config/index.js';

/**
 * Global application logger.
 *
 * Development:
 * - Pretty formatted logs
 *
 * Production:
 * - JSON logs optimized for Docker/Kubernetes/log systems
 */
export const logger = pino({
  level: loggerConfig.level,

  timestamp: loggerConfig.timestamp,

  ...(loggerConfig.pretty && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
});