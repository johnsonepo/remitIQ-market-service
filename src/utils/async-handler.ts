import type { NextFunction, ParamsDictionary, Request, Response } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

type AsyncRouteHandler<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs,
> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next: NextFunction,
) => Promise<unknown>;

/**
 * Wraps an async Express handler so rejected promises are forwarded
 * to next(), instead of needing try/catch in every controller.
 *
 * Generic over the route params (and other Request type parameters)
 * so handlers can declare a specific params shape, e.g.
 * Request<{ code: string }>, and still be accepted here.
 *
 * Usage:
 *   router.get('/currencies', asyncHandler(currencyController.list));
 *   router.get('/currencies/:code', asyncHandler(currencyController.getByCode));
 */
export const asyncHandler =
  <P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = ParsedQs>(
    handler: AsyncRouteHandler<P, ResBody, ReqBody, ReqQuery>,
  ) =>
  (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response<ResBody>, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };