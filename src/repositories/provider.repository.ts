import { prisma } from '../clients/prisma.client.js';
import { BaseRepository } from './base.repository.js';
import type { Provider } from '../../generated/prisma/client.js';

/**
 * Repository for Provider records (external FX data sources).
 *
 * Extends BaseRepository for standard CRUD, and adds provider-specific
 * lookups (by name, active-only listing ordered by priority).
 */
export class ProviderRepository extends BaseRepository<typeof prisma.provider> {
  protected readonly model = prisma.provider;

  /**
   * Finds a single provider by its unique name (e.g. "ExchangeRate-API").
   *
   * @param name - The provider's unique name.
   * @returns The matching Provider record, or null if not found.
   */
  findByName(name: string): Promise<Provider | null> {
    return this.model.findUnique({ where: { name } });
  }

  /**
   * Lists all active providers, ordered by priority ascending
   * (lower priority value = more preferred), for use by the future
   * FX Synchronization job (Phase 5) when selecting which provider(s)
   * to fetch rates from.
   *
   * @returns All active Provider records, ordered by priority.
   */
  findActive(): Promise<Provider[]> {
    return this.model.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' },
    });
  }
}

export const providerRepository = new ProviderRepository();