import type { NextFunction, Request, Response } from 'express';

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

/**
 * Wraps an async Express handler so rejected promises are forwarded
 * to next(), instead of needing try/catch in every controller.
 *
 * Usage:
 *   router.get('/currencies', asyncHandler(currencyController.list));
 */
export const asyncHandler =
  (handler: AsyncRouteHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };