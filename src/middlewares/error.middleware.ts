import { NextFunction, Request, Response } from 'express';

import { logger } from '../utils/logger.js';

/**
 * Global application error handler.
 */
export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  logger.error(error);

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : error.message,
  });
}