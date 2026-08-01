import { describe, expect, it } from 'vitest';

import { ApiError } from '../../src/utils/api-error.js';

describe('ApiError', () => {
  it('sets statusCode, message, and defaults isOperational to true', () => {
    const error = new ApiError(400, 'Bad input');

    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Bad input');
    expect(error.isOperational).toBe(true);
    expect(error.details).toBeUndefined();
  });

  it('accepts explicit isOperational and details', () => {
    const error = new ApiError(500, 'DB down', {
      isOperational: false,
      details: { retryable: true },
    });

    expect(error.isOperational).toBe(false);
    expect(error.details).toEqual({ retryable: true });
  });

  it('is an instance of Error and ApiError', () => {
    const error = ApiError.notFound('Currency not found');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
  });

  describe('static factory methods', () => {
    it('badRequest returns a 400 with the given message', () => {
      const error = ApiError.badRequest('Invalid currency code');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid currency code');
      expect(error.isOperational).toBe(true);
    });

    it('notFound returns a 404', () => {
      const error = ApiError.notFound();
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Not Found');
    });

    it('unauthorized returns a 401', () => {
      expect(ApiError.unauthorized().statusCode).toBe(401);
    });

    it('forbidden returns a 403', () => {
      expect(ApiError.forbidden().statusCode).toBe(403);
    });

    it('conflict returns a 409', () => {
      expect(ApiError.conflict().statusCode).toBe(409);
    });

    it('internal returns a 500 and is marked non-operational', () => {
      const error = ApiError.internal();
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(false);
    });
  });
});