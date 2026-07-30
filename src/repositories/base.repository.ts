import { prisma } from '../clients/prisma.client.js';

/**
 * Generic base repository providing common CRUD operations over any
 * Prisma model delegate (e.g. prisma.currency, prisma.exchangeRate).
 *
 * Extend this per-model:
 *
 *   class CurrencyRepository extends BaseRepository<typeof prisma.currency> {
 *     protected readonly model = prisma.currency;
 *   }
 */
export abstract class BaseRepository<
  TDelegate extends {
    findUnique: (args: any) => Promise<any>;
    findMany: (args?: any) => Promise<any[]>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    count: (args?: any) => Promise<number>;
  },
> {
  protected abstract readonly model: TDelegate;

  findById(id: string, args?: Omit<Parameters<TDelegate['findUnique']>[0], 'where'>) {
    return this.model.findUnique({ where: { id }, ...args });
  }

  findUnique(args: Parameters<TDelegate['findUnique']>[0]) {
    return this.model.findUnique(args);
  }

  findMany(args?: Parameters<TDelegate['findMany']>[0]) {
    return this.model.findMany(args);
  }

  create(args: Parameters<TDelegate['create']>[0]) {
    return this.model.create(args);
  }

  update(id: string, args: Omit<Parameters<TDelegate['update']>[0], 'where'>) {
    return this.model.update({ where: { id }, ...args });
  }

  delete(id: string) {
    return this.model.delete({ where: { id } });
  }

  count(args?: Parameters<TDelegate['count']>[0]) {
    return this.model.count(args);
  }
}
