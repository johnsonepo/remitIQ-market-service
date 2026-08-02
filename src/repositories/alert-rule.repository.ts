import { prisma } from '../clients/prisma.client.js';
import { BaseRepository } from './base.repository.js';

/**
 * Repository for AlertRule records — user-defined rules to be
 * notified when a currency pair's rate crosses a threshold.
 */
export class AlertRuleRepository extends BaseRepository<typeof prisma.alertRule> {
  protected readonly model = prisma.alertRule;

  /**
   * Lists all alert rules belonging to a specific user.
   */
  findByUserId(userId: string): ReturnType<typeof prisma.alertRule.findMany> {
    return this.model.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Lists all active alert rules for a specific currency pair,
   * across all users. Used by the FX sync job's alert-checking step
   * to find which rules need evaluating after a rate update.
   */
  findActiveForPair(
    baseCurrencyId: string,
    quoteCurrencyId: string,
  ): ReturnType<typeof prisma.alertRule.findMany> {
    return this.model.findMany({
      where: { baseCurrencyId, quoteCurrencyId, isActive: true },
    });
  }
}

export const alertRuleRepository = new AlertRuleRepository();