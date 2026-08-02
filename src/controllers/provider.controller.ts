import type { Request, Response } from 'express';

import { providerRepository } from '../repositories/provider.repository.js';
import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';

/**
 * Handlers for provider-related endpoints.
 */
export const providerController = {
  /**
   * GET /api/v1/providers
   *
   * Lists all providers. Supports an optional `?active=true` query
   * param to filter to active providers only, ordered by priority.
   */
  async list(req: Request, res: Response): Promise<void> {
    const activeOnly = req.query.active === 'true';

    const providers = activeOnly
      ? await providerRepository.findActive()
      : await providerRepository.findMany();

    ApiResponse.send(res, 200, providers, 'Providers fetched');
  },

  /**
   * GET /api/v1/providers/:name
   *
   * Fetches a single provider by its unique name.
   * Throws a 404 ApiError if no matching provider exists.
   */
  async getByName(req: Request<{ name: string }>, res: Response): Promise<void> {
    const { name } = req.params;

    const provider = await providerRepository.findByName(name);

    if (!provider) {
      throw ApiError.notFound(`Provider with name "${name}" not found`);
    }

    ApiResponse.send(res, 200, provider, 'Provider fetched');
  },
};