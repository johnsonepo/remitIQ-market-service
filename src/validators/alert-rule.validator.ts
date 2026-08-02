import { z } from 'zod';

/**
 * Validates the payload for creating a new alert rule.
 *
 * userId is accepted directly in the body as a placeholder, same as
 * CommunityRate — will be replaced with a JWT-derived userId once
 * authentication against the Household Service is wired up.
 */
export const createAlertRuleSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  baseCurrencyCode: z.string().length(3, 'Must be a 3-letter currency code'),
  quoteCurrencyCode: z.string().length(3, 'Must be a 3-letter currency code'),
  condition: z.enum(['GREATER_THAN_OR_EQUAL', 'LESS_THAN_OR_EQUAL']),
  threshold: z.number().positive('Threshold must be a positive number'),
});

export type CreateAlertRuleInput = z.infer<typeof createAlertRuleSchema>;