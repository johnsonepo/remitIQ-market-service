import { beforeEach, describe, expect, it, vi } from 'vitest';

import { checkAlertsForRate } from '../../src/services/alert-check.service.js';
import { alertRuleRepository } from '../../src/repositories/alert-rule.repository.js';
import { alertEventRepository } from '../../src/repositories/alert-event.repository.js';

vi.mock('../../src/repositories/alert-rule.repository.js', () => ({
  alertRuleRepository: { findActiveForPair: vi.fn() },
}));

vi.mock('../../src/repositories/alert-event.repository.js', () => ({
  alertEventRepository: { create: vi.fn() },
}));

describe('checkAlertsForRate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an event when GREATER_THAN_OR_EQUAL condition is met', async () => {
    (alertRuleRepository.findActiveForPair as any).mockResolvedValue([
      { id: 'rule-1', userId: 'u1', condition: 'GREATER_THAN_OR_EQUAL', threshold: 500 },
    ]);
    (alertEventRepository.create as any).mockResolvedValue({});

    const count = await checkAlertsForRate('base-id', 'quote-id', 600);

    expect(count).toBe(1);
    expect(alertEventRepository.create).toHaveBeenCalledWith({
      data: { alertRuleId: 'rule-1', triggeredRate: 600, status: 'PENDING' },
    });
  });

  it('does not create an event when GREATER_THAN_OR_EQUAL condition is not met', async () => {
    (alertRuleRepository.findActiveForPair as any).mockResolvedValue([
      { id: 'rule-1', userId: 'u1', condition: 'GREATER_THAN_OR_EQUAL', threshold: 500 },
    ]);

    const count = await checkAlertsForRate('base-id', 'quote-id', 400);

    expect(count).toBe(0);
    expect(alertEventRepository.create).not.toHaveBeenCalled();
  });

  it('creates an event when LESS_THAN_OR_EQUAL condition is met', async () => {
    (alertRuleRepository.findActiveForPair as any).mockResolvedValue([
      { id: 'rule-2', userId: 'u2', condition: 'LESS_THAN_OR_EQUAL', threshold: 500 },
    ]);
    (alertEventRepository.create as any).mockResolvedValue({});

    const count = await checkAlertsForRate('base-id', 'quote-id', 450);

    expect(count).toBe(1);
  });

  it('does not create an event when LESS_THAN_OR_EQUAL condition is not met', async () => {
    (alertRuleRepository.findActiveForPair as any).mockResolvedValue([
      { id: 'rule-2', userId: 'u2', condition: 'LESS_THAN_OR_EQUAL', threshold: 500 },
    ]);

    const count = await checkAlertsForRate('base-id', 'quote-id', 550);

    expect(count).toBe(0);
  });

  it('triggers a threshold exactly equal to the current rate (inclusive boundary)', async () => {
    (alertRuleRepository.findActiveForPair as any).mockResolvedValue([
      { id: 'rule-3', userId: 'u3', condition: 'GREATER_THAN_OR_EQUAL', threshold: 500 },
    ]);
    (alertEventRepository.create as any).mockResolvedValue({});

    const count = await checkAlertsForRate('base-id', 'quote-id', 500);

    expect(count).toBe(1);
  });

  it('evaluates multiple rules independently, only triggering the ones that match', async () => {
    (alertRuleRepository.findActiveForPair as any).mockResolvedValue([
      { id: 'rule-a', userId: 'u1', condition: 'GREATER_THAN_OR_EQUAL', threshold: 500 },
      { id: 'rule-b', userId: 'u2', condition: 'GREATER_THAN_OR_EQUAL', threshold: 700 },
      { id: 'rule-c', userId: 'u3', condition: 'LESS_THAN_OR_EQUAL', threshold: 550 },
    ]);
    (alertEventRepository.create as any).mockResolvedValue({});

    const count = await checkAlertsForRate('base-id', 'quote-id', 600);

    // rule-a (600 >= 500) triggers, rule-b (600 >= 700) doesn't,
    // rule-c (600 <= 550) doesn't
    expect(count).toBe(1);
    expect(alertEventRepository.create).toHaveBeenCalledTimes(1);
    expect(alertEventRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ alertRuleId: 'rule-a' }) }),
    );
  });

  it('returns 0 when no active rules exist for the pair', async () => {
    (alertRuleRepository.findActiveForPair as any).mockResolvedValue([]);

    const count = await checkAlertsForRate('base-id', 'quote-id', 600);

    expect(count).toBe(0);
    expect(alertEventRepository.create).not.toHaveBeenCalled();
  });
});