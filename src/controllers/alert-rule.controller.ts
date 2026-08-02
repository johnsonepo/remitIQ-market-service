import type { Request, Response } from 'express';

import { currencyRepository } from '../repositories/currency.repository.js';
import { alertRuleRepository } from '../repositories/alert-rule.repository.js';
import { alertEventRepository } from '../repositories/alert-event.repository.js';
import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';
import type { CreateAlertRuleInput } from '../validators/alert-rule.validator.js';

async function resolveCurrencyOrFail(code: string) {
  const currency = await currencyRepository.findByCode(code.toUpperCase());
  if (!currency) {
    throw ApiError.notFound(`Currency with code "${code}" not found`);
  }
  return currency;
}

/**
 * Handlers for alert rule endpoints.
 */
export const alertRuleController = {
  /**
   * POST /api/v1/alert-rules
   *
   * Creates a new alert rule. Body validated by createAlertRuleSchema.
   */
  async create(req: Request, res: Response): Promise<void> {
    const body = req.body as CreateAlertRuleInput;

    const baseCurrency = await resolveCurrencyOrFail(body.baseCurrencyCode);
    const quoteCurrency = await resolveCurrencyOrFail(body.quoteCurrencyCode);

    const created = await alertRuleRepository.create({
      data: {
        userId: body.userId,
        baseCurrencyId: baseCurrency.id,
        quoteCurrencyId: quoteCurrency.id,
        condition: body.condition,
        threshold: body.threshold,
      },
    });

    ApiResponse.created(res, created, 'Alert rule created');
  },

  /**
   * GET /api/v1/alert-rules/:userId
   *
   * Lists all alert rules belonging to a user.
   */
  async listByUser(req: Request<{ userId: string }>, res: Response): Promise<void> {
    const { userId } = req.params;
    const rules = await alertRuleRepository.findByUserId(userId);
    ApiResponse.send(res, 200, rules, 'Alert rules fetched');
  },

  /**
   * DELETE /api/v1/alert-rules/:id
   *
   * Deletes an alert rule by ID.
   */
  async remove(req: Request<{ id: string }>, res: Response): Promise<void> {
    const { id } = req.params;

    const existing = await alertRuleRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound(`Alert rule with id "${id}" not found`);
    }

    await alertRuleRepository.delete(id);
    ApiResponse.noContent(res);
  },

  /**
   * GET /api/v1/alert-rules/:id/events
   *
   * Lists all triggered events for a specific alert rule.
   */
  async listEvents(req: Request<{ id: string }>, res: Response): Promise<void> {
    const { id } = req.params;

    const rule = await alertRuleRepository.findById(id);
    if (!rule) {
      throw ApiError.notFound(`Alert rule with id "${id}" not found`);
    }

    const events = await alertEventRepository.findByAlertRuleId(id);
    ApiResponse.send(res, 200, events, 'Alert events fetched');
  },
};