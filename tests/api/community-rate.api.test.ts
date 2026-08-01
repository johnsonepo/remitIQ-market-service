import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../../src/app.js';
import { prisma } from '../../src/clients/prisma.client.js';
import { resetTestDatabase } from '../helpers/db.js';

describe('Community Rate API', () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  describe('POST /api/v1/community-rates', () => {
    it('creates a community rate with valid input', async () => {
      await prisma.currency.createMany({
        data: [
          { code: 'USD', name: 'US Dollar' },
          { code: 'XAF', name: 'CFA Franc' },
        ],
      });

      const response = await request(app).post('/api/v1/community-rates').send({
        userId: 'test-user-1',
        baseCurrencyCode: 'USD',
        quoteCurrencyCode: 'XAF',
        rate: 625,
        location: 'Douala',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.rate).toBe('625');
    });

    it('returns 400 when the currency code is not 3 letters', async () => {
      const response = await request(app).post('/api/v1/community-rates').send({
        userId: 'test-user-1',
        baseCurrencyCode: 'XX',
        quoteCurrencyCode: 'XAF',
        rate: 625,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('returns 400 when rate is not positive', async () => {
      const response = await request(app).post('/api/v1/community-rates').send({
        userId: 'test-user-1',
        baseCurrencyCode: 'USD',
        quoteCurrencyCode: 'XAF',
        rate: -5,
      });

      expect(response.status).toBe(400);
    });

    it('returns 400 when userId is missing', async () => {
      const response = await request(app).post('/api/v1/community-rates').send({
        baseCurrencyCode: 'USD',
        quoteCurrencyCode: 'XAF',
        rate: 625,
      });

      expect(response.status).toBe(400);
    });

    it('returns 404 when the currency code is valid format but does not exist', async () => {
      const response = await request(app).post('/api/v1/community-rates').send({
        userId: 'test-user-1',
        baseCurrencyCode: 'ABC',
        quoteCurrencyCode: 'XAF',
        rate: 625,
      });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/community-rates/:base/:quote', () => {
    it('returns submitted rates for the pair, most recent first', async () => {
      const [usd, xaf] = await Promise.all([
        prisma.currency.create({ data: { code: 'USD', name: 'US Dollar' } }),
        prisma.currency.create({ data: { code: 'XAF', name: 'CFA Franc' } }),
      ]);

      await prisma.communityRate.create({
        data: { userId: 'u1', baseCurrencyId: usd.id, quoteCurrencyId: xaf.id, rate: 620 },
      });
      await prisma.communityRate.create({
        data: { userId: 'u2', baseCurrencyId: usd.id, quoteCurrencyId: xaf.id, rate: 630 },
      });

      const response = await request(app).get('/api/v1/community-rates/USD/XAF');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });
  });
});