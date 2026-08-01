import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../../src/app.js';
import { prisma } from '../../src/clients/prisma.client.js';
import { resetTestDatabase } from '../helpers/db.js';

describe('Currency API', () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  describe('GET /api/v1/currencies', () => {
    it('returns an empty list when no currencies exist', async () => {
      const response = await request(app).get('/api/v1/currencies');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('returns all seeded currencies', async () => {
      await prisma.currency.createMany({
        data: [
          { code: 'USD', name: 'US Dollar' },
          { code: 'XAF', name: 'CFA Franc' },
        ],
      });

      const response = await request(app).get('/api/v1/currencies');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });

    it('filters to active only when ?active=true is passed', async () => {
      await prisma.currency.createMany({
        data: [
          { code: 'USD', name: 'US Dollar', isActive: true },
          { code: 'ZZZ', name: 'Deprecated', isActive: false },
        ],
      });

      const response = await request(app).get('/api/v1/currencies?active=true');

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].code).toBe('USD');
    });
  });

  describe('GET /api/v1/currencies/:code', () => {
    it('returns the matching currency', async () => {
      await prisma.currency.create({ data: { code: 'USD', name: 'US Dollar' } });

      const response = await request(app).get('/api/v1/currencies/USD');

      expect(response.status).toBe(200);
      expect(response.body.data.code).toBe('USD');
    });

    it('is case-insensitive on the code lookup', async () => {
      await prisma.currency.create({ data: { code: 'USD', name: 'US Dollar' } });

      const response = await request(app).get('/api/v1/currencies/usd');

      expect(response.status).toBe(200);
      expect(response.body.data.code).toBe('USD');
    });

    it('returns 404 with the standard error envelope for an unknown code', async () => {
      const response = await request(app).get('/api/v1/currencies/ZZZ');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('ZZZ');
    });
  });
});