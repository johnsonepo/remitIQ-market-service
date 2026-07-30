/**
 * Standardized application error.
 *
 * Throw this anywhere in controllers/services/repositories instead of
 * generic Error objects, so the error middleware can respond consistently.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    options: { isOperational?: boolean; details?: unknown } = {},
  ) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = options.isOperational ?? true;
    this.details = options.details;

    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  public static badRequest(message = 'Bad Request', details?: unknown): ApiError {
    return new ApiError(400, message, { details });
  }

  public static unauthorized(message = 'Unauthorized', details?: unknown): ApiError {
    return new ApiError(401, message, { details });
  }

  public static forbidden(message = 'Forbidden', details?: unknown): ApiError {
    return new ApiError(403, message, { details });
  }

  public static notFound(message = 'Not Found', details?: unknown): ApiError {
    return new ApiError(404, message, { details });
  }

  public static conflict(message = 'Conflict', details?: unknown): ApiError {
    return new ApiError(409, message, { details });
  }

  public static internal(message = 'Internal Server Error', details?: unknown): ApiError {
    return new ApiError(500, message, { isOperational: false, details });
  }
}