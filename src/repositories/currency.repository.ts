// src/repositories/currency.repository.ts
import { prisma } from '../clients/prisma.client.js';
import { BaseRepository } from './base.repository.js';

/**
 * Repository for handling database operations related to currencies.
 * Extends the generic BaseRepository to inherit standard CRUD operations.
 */
export class CurrencyRepository extends BaseRepository<typeof prisma.currency> {
  protected readonly model = prisma.currency;

  /**
   * Finds a unique currency record by its unique code.
   * 
   * @param code - The currency code (e.g., USD, EUR).
   * @returns A promise resolving to the currency record or null if not found.
   */
  public findByCode(code: string): ReturnType<typeof this.model.findUnique> {
    return this.model.findUnique({ where: { code } });
  }

  /**
   * Retrieves all currency records that are currently marked as active.
   * 
   * @returns A promise resolving to an array of active currency records.
   */
  public findActive(): ReturnType<typeof this.model.findMany> {
    return this.model.findMany({ where: { isActive: true } });
  }
}

/**
 * Singleton instance of CurrencyRepository for use across services.
 */
export const currencyRepository = new CurrencyRepository();