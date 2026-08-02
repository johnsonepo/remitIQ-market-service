import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../../src/app.js';
import { prisma } from '../../src/clients/prisma.client.js';
import { resetTestDatabase } from '../helpers/db.js';

describe('Alert Rule API', () => {
  let usdCode: string;
  let xafCode: string;

  beforeEach(async () => {
    await resetTestDatabase();
    await prisma.currency.createMany({
      data: [
        { code: 'USD', name: 'US Dollar' },
        { code: 'XAF', name: 'CFA Franc' },
      ],
    });
    usdCode = 'USD';
    xafCode = 'XAF';
  });

  describe('POST /api/v1/alert-rules', () => {
    it('creates an alert rule with valid input', async () => {
      const response = await request(app).post('/api/v1/alert-rules').send({
        userId: 'test-user',
        baseCurrencyCode: usdCode,
        quoteCurrencyCode: xafCode,
        condition: 'GREATER_THAN_OR_EQUAL',
        threshold: 650,
      });

      expect(response.status).toBe(201);
      expect(response.body.data.threshold).toBe('650');
    });

    it('returns 400 for an invalid condition value', async () => {
      const response = await request(app).post('/api/v1/alert-rules').send({
        userId: 'test-user',
        baseCurrencyCode: usdCode,
        quoteCurrencyCode: xafCode,
        condition: 'NOT_A_REAL_CONDITION',
        threshold: 650,
      });

      expect(response.status).toBe(400);
    });

    it('returns 400 for a non-positive threshold', async () => {
      const response = await request(app).post('/api/v1/alert-rules').send({
        userId: 'test-user',
        baseCurrencyCode: usdCode,
        quoteCurrencyCode: xafCode,
        condition: 'GREATER_THAN_OR_EQUAL',
        threshold: -10,
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/alert-rules/:userId', () => {
    it('lists rules for the given user', async () => {
      await request(app).post('/api/v1/alert-rules').send({
        userId: 'test-user',
        baseCurrencyCode: usdCode,
        quoteCurrencyCode: xafCode,
        condition: 'GREATER_THAN_OR_EQUAL',
        threshold: 650,
      });

      const response = await request(app).get('/api/v1/alert-rules/test-user');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('DELETE /api/v1/alert-rules/:id', () => {
    it('deletes an existing rule', async () => {
      const created = await request(app).post('/api/v1/alert-rules').send({
        userId: 'test-user',
        baseCurrencyCode: usdCode,
        quoteCurrencyCode: xafCode,
        condition: 'GREATER_THAN_OR_EQUAL',
        threshold: 650,
      });

      const ruleId = created.body.data.id;

      const deleteResponse = await request(app).delete(`/api/v1/alert-rules/${ruleId}`);
      expect(deleteResponse.status).toBe(204);

      const listResponse = await request(app).get('/api/v1/alert-rules/test-user');
      expect(listResponse.body.data).toHaveLength(0);
    });

    it('returns 404 when deleting a nonexistent rule', async () => {
      const response = await request(app).delete(
        '/api/v1/alert-rules/00000000-0000-0000-0000-000000000000',
      );
      expect(response.status).toBe(404);
    });
  });
});