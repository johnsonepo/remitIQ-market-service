import type { Response } from 'express';

interface ApiResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  [key: string]: unknown;
}

interface SuccessPayload<T> {
  success: true;
  message: string;
  data: T;
  meta?: ApiResponseMeta;
}

/**
 * Standard success response envelope.
 *
 * Usage:
 *   ApiResponse.send(res, 200, currencies, 'Currencies fetched');
 *   ApiResponse.send(res, 200, rates, 'Rates fetched', { page: 1, total: 50 });
 */
export class ApiResponse {
  static send<T>(
    res: Response,
    statusCode: number,
    data: T,
    message = 'Success',
    meta?: ApiResponseMeta,
  ): Response {
    const payload: SuccessPayload<T> = {
      success: true,
      message,
      data,
      ...(meta && { meta }),
    };

    return res.status(statusCode).json(payload);
  }

  static created<T>(res: Response, data: T, message = 'Created'): Response {
    return this.send(res, 201, data, message);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}