import { beforeEach, describe, expect, it } from 'vitest';

import { alertRuleRepository } from '../../src/repositories/alert-rule.repository.js';
import { prisma } from '../../src/clients/prisma.client.js';
import { resetTestDatabase } from '../helpers/db.js';

describe('AlertRuleRepository (integration)', () => {
  let usdId: string;
  let xafId: string;

  beforeEach(async () => {
    await resetTestDatabase();

    const [usd, xaf] = await Promise.all([
      prisma.currency.create({ data: { code: 'USD', name: 'US Dollar' } }),
      prisma.currency.create({ data: { code: 'XAF', name: 'CFA Franc' } }),
    ]);
    usdId = usd.id;
    xafId = xaf.id;
  });

  describe('findByUserId', () => {
    it('returns only rules belonging to the given user', async () => {
      await prisma.alertRule.createMany({
        data: [
          {
            userId: 'user-1',
            baseCurrencyId: usdId,
            quoteCurrencyId: xafId,
            condition: 'GREATER_THAN_OR_EQUAL',
            threshold: 500,
          },
          {
            userId: 'user-2',
            baseCurrencyId: usdId,
            quoteCurrencyId: xafId,
            condition: 'GREATER_THAN_OR_EQUAL',
            threshold: 600,
          },
        ],
      });

      const result = await alertRuleRepository.findByUserId('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-1');
    });
  });

  describe('findActiveForPair', () => {
    it('excludes inactive rules', async () => {
      await prisma.alertRule.createMany({
        data: [
          {
            userId: 'user-1',
            baseCurrencyId: usdId,
            quoteCurrencyId: xafId,
            condition: 'GREATER_THAN_OR_EQUAL',
            threshold: 500,
            isActive: true,
          },
          {
            userId: 'user-1',
            baseCurrencyId: usdId,
            quoteCurrencyId: xafId,
            condition: 'GREATER_THAN_OR_EQUAL',
            threshold: 600,
            isActive: false,
          },
        ],
      });

      const result = await alertRuleRepository.findActiveForPair(usdId, xafId);

      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });
  });
});