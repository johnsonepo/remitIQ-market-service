import { prisma } from '../clients/prisma.client.js';
import { BaseRepository } from './base.repository.js';

/**
 * Repository for AlertEvent records — a log of each time an
 * AlertRule was triggered and (attempted to be) notified.
 */
export class AlertEventRepository extends BaseRepository<
  typeof prisma.alertEvent
> {
  protected readonly model = prisma.alertEvent;

  /**
   * Lists all events for a specific alert rule, most recent first.
   */
  findByAlertRuleId(
    alertRuleId: string,
  ): ReturnType<typeof prisma.alertEvent.findMany> {
    return this.model.findMany({
      where: {
        alertRuleId,
      },
      orderBy: {
        triggeredAt: 'desc',
      },
    });
  }
}

export const alertEventRepository = new AlertEventRepository();