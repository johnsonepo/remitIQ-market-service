/* eslint-disable @typescript-eslint/no-explicit-any */
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

  findById(
    id: string,
    args?: Omit<Parameters<TDelegate['findUnique']>[0], 'where'>,
  ): ReturnType<TDelegate['findUnique']> {
    return this.model.findUnique({
      where: { id },
      ...args,
    }) as ReturnType<TDelegate['findUnique']>;
  }

  findUnique(
    args: Parameters<TDelegate['findUnique']>[0],
  ): ReturnType<TDelegate['findUnique']> {
    return this.model.findUnique(args) as ReturnType<TDelegate['findUnique']>;
  }

  findMany(
    args?: Parameters<TDelegate['findMany']>[0],
  ): ReturnType<TDelegate['findMany']> {
    return this.model.findMany(args) as ReturnType<TDelegate['findMany']>;
  }

  create(
    args: Parameters<TDelegate['create']>[0],
  ): ReturnType<TDelegate['create']> {
    return this.model.create(args) as ReturnType<TDelegate['create']>;
  }

  update(
    id: string,
    args: Omit<Parameters<TDelegate['update']>[0], 'where'>,
  ): ReturnType<TDelegate['update']> {
    return this.model.update({
      where: { id },
      ...args,
    }) as ReturnType<TDelegate['update']>;
  }

  delete(id: string): ReturnType<TDelegate['delete']> {
    return this.model.delete({
      where: { id },
    }) as ReturnType<TDelegate['delete']>;
  }

  count(
    args?: Parameters<TDelegate['count']>[0],
  ): ReturnType<TDelegate['count']> {
    return this.model.count(args) as ReturnType<TDelegate['count']>;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */