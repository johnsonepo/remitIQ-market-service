import { z } from 'zod';

/**
 * Validates the payload for submitting a new community-reported
 * exchange rate observation.
 */
export const submitCommunityRateSchema = z.object({
  userId: z.string().min(1, 'userId is required'), // TODO: replace with JWT-derived userId once auth is wired
  baseCurrencyCode: z.string().length(3, 'Must be a 3-letter currency code'),
  quoteCurrencyCode: z.string().length(3, 'Must be a 3-letter currency code'),
  rate: z.number().positive('Rate must be a positive number'),
  location: z.string().min(1).max(100).optional(),
});

export type SubmitCommunityRateInput = z.infer<typeof submitCommunityRateSchema>;