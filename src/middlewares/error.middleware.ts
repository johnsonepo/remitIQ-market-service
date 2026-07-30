import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';

/**
 * Global application error handler.
 */
export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void {
  // Zod validation errors -> 400 with field-level details
  if (error instanceof ZodError) {
    logger.warn({ issues: error.issues, path: req.path }, 'Validation error');

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  // Known, expected application errors
  if (error instanceof ApiError) {
    if (error.isOperational) {
      logger.warn({ message: error.message, path: req.path }, 'API error');
    } else {
      logger.error({ err: error, path: req.path }, 'Non-operational API error');
    }

    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
    return;
  }

  // Unexpected errors
  logger.error(error);

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message,
  });
}