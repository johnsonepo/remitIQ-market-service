import { alertRuleRepository } from '../repositories/alert-rule.repository.js';
import { alertEventRepository } from '../repositories/alert-event.repository.js';
import { logger } from '../utils/logger.js';

/**
 * Checks all active alert rules for a currency pair against a
 * newly-updated rate, creating an AlertEvent (status: PENDING) for
 * any rule whose condition is met.
 *
 * Actual notification delivery (email/push/SMS) is intentionally out
 * of scope here — AlertEvent.status starts PENDING and is left for a
 * future notification worker to pick up, once the Household Service
 * exists to own user contact information (Market Service never owns
 * user accounts, per the master spec section 14).
 *
 * @param baseCurrencyId - ID of the base currency for the updated rate.
 * @param quoteCurrencyId - ID of the quote currency for the updated rate.
 * @param currentRate - The newly-updated rate value.
 * @returns The number of alert events created.
 */
export async function checkAlertsForRate(
  baseCurrencyId: string,
  quoteCurrencyId: string,
  currentRate: number,
): Promise<number> {
  const activeRules = await alertRuleRepository.findActiveForPair(baseCurrencyId, quoteCurrencyId);

  let triggeredCount = 0;

  for (const rule of activeRules) {
    const threshold = Number(rule.threshold);

    const isTriggered =
      rule.condition === 'GREATER_THAN_OR_EQUAL'
        ? currentRate >= threshold
        : currentRate <= threshold;

    if (!isTriggered) continue;

    await alertEventRepository.create({
      data: {
        alertRuleId: rule.id,
        triggeredRate: currentRate,
        status: 'PENDING',
      },
    });

    logger.info(
      { alertRuleId: rule.id, userId: rule.userId, condition: rule.condition, threshold, currentRate },
      'Alert Check: rule triggered, event created',
    );

    triggeredCount++;
  }

  return triggeredCount;
}