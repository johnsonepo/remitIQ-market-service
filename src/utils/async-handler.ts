import type {
  NextFunction,
  ParamsDictionary,
  Request,
  Response,
} from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

/**
 * Represents an asynchronous Express route handler.
 */
type AsyncRouteHandler<
  P = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = ParsedQs,
> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next: NextFunction,
) => Promise<unknown>;

/**
 * Wraps an async Express route handler and automatically forwards
 * rejected promises to Express' error middleware.
 *
 * This removes the need to wrap every controller action in
 * try/catch blocks solely to call `next(error)`.
 *
 * The generic parameters preserve the route's request and response
 * types, allowing controllers to specify typed params, bodies,
 * queries, and response payloads.
 *
 * Example:
 *
 *   router.get(
 *     '/currencies/:code',
 *     asyncHandler(currencyController.getByCode),
 *   );
 */
export const asyncHandler = <
  P = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = ParsedQs,
>(
  handler: AsyncRouteHandler<P, ResBody, ReqBody, ReqQuery>,
) => {
  return (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction,
  ): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};