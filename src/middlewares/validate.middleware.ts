import type { NextFunction, Request, Response } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { ZodType } from 'zod';

/**
 * Interface defining the optional Zod schemas for validating different parts of an HTTP request.
 */
interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Higher-order middleware factory that validates incoming request payloads (`body`, `query`, or `params`) 
 * against provided Zod schemas.
 * 
 * If validation fails, Zod throws a `ZodError`, which is automatically intercepted and handled 
 * by your global error-handling middleware. If successful, the validated and sanitized data 
 * replaces the original request properties.
 *
 * @param schemas - An object containing optional Zod schemas for body, query, and/or params.
 * @returns An Express middleware function.
 * 
 * @example
 *   router.post('/currencies', validate({ body: createCurrencySchema }), asyncHandler(...));
 */
export const validate =
  (schemas: ValidationSchemas) =>
  (req: Request, res: Response, next: NextFunction): void => {
    // Validate and sanitize the request body payload if schema is provided
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }

    // Validate and sanitize URL query parameters if schema is provided, 
    // casting the output to Express's expected ParsedQs type
    if (schemas.query) {
      req.query = schemas.query.parse(req.query) as ParsedQs;
    }

    // Validate and sanitize route path parameters if schema is provided, 
    // casting the output to Express's expected ParamsDictionary type
    if (schemas.params) {
      req.params = schemas.params.parse(req.params) as ParamsDictionary;
    }

    // Proceed to the next middleware or route handler if all validations pass
    next();
  };