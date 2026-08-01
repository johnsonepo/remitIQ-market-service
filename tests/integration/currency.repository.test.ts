import { beforeEach, describe, expect, it } from 'vitest';

import { currencyRepository } from '../../src/repositories/currency.repository.js';
import { prisma } from '../../src/clients/prisma.client.js';
import { resetTestDatabase } from '../helpers/db.js';

describe('CurrencyRepository (integration)', () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  describe('findByCode', () => {
    it('returns the matching currency when it exists', async () => {
      await prisma.currency.create({
        data: { code: 'USD', name: 'US Dollar', symbol: '$' },
      });

      const result = await currencyRepository.findByCode('USD');

      expect(result).not.toBeNull();
      expect(result?.code).toBe('USD');
      expect(result?.name).toBe('US Dollar');
    });

    it('returns null when no currency matches', async () => {
      const result = await currencyRepository.findByCode('ZZZ');

      expect(result).toBeNull();
    });
  });

  describe('findActive', () => {
    it('returns only currencies flagged as active', async () => {
      await prisma.currency.createMany({
        data: [
          { code: 'USD', name: 'US Dollar', isActive: true },
          { code: 'XAF', name: 'CFA Franc', isActive: true },
          { code: 'ZZZ', name: 'Deprecated Currency', isActive: false },
        ],
      });

      const result = await currencyRepository.findActive();

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.code).sort()).toEqual(['USD', 'XAF']);
    });

    it('returns an empty array when no active currencies exist', async () => {
      await prisma.currency.create({
        data: { code: 'ZZZ', name: 'Inactive', isActive: false },
      });

      const result = await currencyRepository.findActive();

      expect(result).toEqual([]);
    });
  });

  describe('BaseRepository CRUD (inherited)', () => {
    it('creates and retrieves a currency by id', async () => {
      const created = await currencyRepository.create({
        data: { code: 'EUR', name: 'Euro', symbol: '€' },
      });

      const found = await currencyRepository.findById(created.id);

      expect(found?.code).toBe('EUR');
    });

    it('enforces the unique constraint on code', async () => {
      await prisma.currency.create({ data: { code: 'GBP', name: 'British Pound' } });

      await expect(
        currencyRepository.create({ data: { code: 'GBP', name: 'Duplicate Pound' } }),
      ).rejects.toThrow();
    });

    it('updates a currency', async () => {
      const created = await prisma.currency.create({
        data: { code: 'AED', name: 'UAE Dirham', isActive: true },
      });

      const updated = await currencyRepository.update(created.id, {
        data: { isActive: false },
      });

      expect(updated.isActive).toBe(false);
    });

    it('deletes a currency', async () => {
      const created = await prisma.currency.create({
        data: { code: 'JPY', name: 'Japanese Yen' },
      });

      await currencyRepository.delete(created.id);

      const found = await currencyRepository.findById(created.id);
      expect(found).toBeNull();
    });
  });
});