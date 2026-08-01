import { beforeEach, describe, expect, it, vi } from 'vitest';

import { findBestRate } from '../../src/services/rate-comparison.service.js';
import { currencyRepository } from '../../src/repositories/currency.repository.js';
import { exchangeRateRepository } from '../../src/repositories/exchange-rate.repository.js';
import { communityRateRepository } from '../../src/repositories/community-rate.repository.js';
import { ApiError } from '../../src/utils/api-error.js';

vi.mock('../../src/repositories/currency.repository.js', () => ({
  currencyRepository: { findByCode: vi.fn() },
}));

vi.mock('../../src/repositories/exchange-rate.repository.js', () => ({
  exchangeRateRepository: { findLatestForPair: vi.fn() },
}));

vi.mock('../../src/repositories/community-rate.repository.js', () => ({
  communityRateRepository: { findLatestForPair: vi.fn() },
}));

const USD = { id: 'usd-id', code: 'USD' };
const XAF = { id: 'xaf-id', code: 'XAF' };

describe('findBestRate', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: both currencies resolve successfully.
    (currencyRepository.findByCode as any).mockImplementation((code: string) => {
      if (code === 'USD') return Promise.resolve(USD);
      if (code === 'XAF') return Promise.resolve(XAF);
      return Promise.resolve(null);
    });
  });

  it('throws ApiError.notFound if the base currency code is invalid', async () => {
    (currencyRepository.findByCode as any).mockResolvedValueOnce(null);

    await expect(findBestRate('ZZZ', 'XAF')).rejects.toThrow(ApiError);
  });

  it('throws ApiError.notFound if the quote currency code is invalid', async () => {
    (currencyRepository.findByCode as any)
      .mockResolvedValueOnce(USD) // base resolves
      .mockResolvedValueOnce(null); // quote fails

    await expect(findBestRate('USD', 'ZZZ')).rejects.toThrow(ApiError);
  });

  it('throws ApiError.notFound if neither official nor community rate exists', async () => {
    (exchangeRateRepository.findLatestForPair as any).mockResolvedValue(null);
    (communityRateRepository.findLatestForPair as any).mockResolvedValue(null);

    await expect(findBestRate('USD', 'XAF')).rejects.toThrow(ApiError);
  });

  it('returns the official rate when only an official rate exists', async () => {
    (exchangeRateRepository.findLatestForPair as any).mockResolvedValue({
      rate: 610.5,
      fetchedAt: new Date('2026-01-01'),
      provider: { name: 'ExchangeRate-API' },
    });
    (communityRateRepository.findLatestForPair as any).mockResolvedValue(null);

    const result = await findBestRate('USD', 'XAF');

    expect(result.source).toBe('official');
    expect(result.rate).toBe(610.5);
    expect(result.providerName).toBe('ExchangeRate-API');
    expect(result.comparedTo.community).toBeNull();
  });

  it('returns the community rate when only a community rate exists', async () => {
    (exchangeRateRepository.findLatestForPair as any).mockResolvedValue(null);
    (communityRateRepository.findLatestForPair as any).mockResolvedValue({
      rate: 630,
      location: 'Douala',
      submittedAt: new Date('2026-01-01'),
    });

    const result = await findBestRate('USD', 'XAF');

    expect(result.source).toBe('community');
    expect(result.rate).toBe(630);
    expect(result.location).toBe('Douala');
    expect(result.comparedTo.official).toBeNull();
  });

  it('returns the community rate when it is higher than the official rate', async () => {
    (exchangeRateRepository.findLatestForPair as any).mockResolvedValue({
      rate: 610.5,
      fetchedAt: new Date(),
      provider: { name: 'ExchangeRate-API' },
    });
    (communityRateRepository.findLatestForPair as any).mockResolvedValue({
      rate: 630,
      location: 'Douala',
      submittedAt: new Date(),
    });

    const result = await findBestRate('USD', 'XAF');

    expect(result.source).toBe('community');
    expect(result.rate).toBe(630);
    expect(result.comparedTo.official?.rate).toBe(610.5);
    expect(result.comparedTo.community?.rate).toBe(630);
  });

  it('returns the official rate when it is higher than the community rate', async () => {
    (exchangeRateRepository.findLatestForPair as any).mockResolvedValue({
      rate: 640,
      fetchedAt: new Date(),
      provider: { name: 'ExchangeRate-API' },
    });
    (communityRateRepository.findLatestForPair as any).mockResolvedValue({
      rate: 610,
      location: 'Douala',
      submittedAt: new Date(),
    });

    const result = await findBestRate('USD', 'XAF');

    expect(result.source).toBe('official');
    expect(result.rate).toBe(640);
  });

  it('returns the official rate when both rates are exactly equal', async () => {
    (exchangeRateRepository.findLatestForPair as any).mockResolvedValue({
      rate: 620,
      fetchedAt: new Date(),
      provider: { name: 'ExchangeRate-API' },
    });
    (communityRateRepository.findLatestForPair as any).mockResolvedValue({
      rate: 620,
      location: 'Douala',
      submittedAt: new Date(),
    });

    const result = await findBestRate('USD', 'XAF');

    // Ties resolve to official, per the >, not >=, comparison in the service.
    expect(result.source).toBe('official');
  });
});