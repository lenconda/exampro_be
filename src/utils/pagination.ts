import { FindManyOptions, LessThan, MoreThan, Repository } from 'typeorm';
import _ from 'lodash';

export interface QueryPaginationOptions<K> {
  cursorColumn?: string;
  orderColumn?: string;
  query?: FindManyOptions<K>;
}

export const queryWithPagination = async <T, K>(
  repository: Repository<any>,
  lastCursor: T = null,
  cursorOrder: 'ASC' | 'DESC',
  size: number,
  options: QueryPaginationOptions<K> = {},
): Promise<{ items: K[]; total?: number }> => {
  const { cursorColumn = 'id', orderColumn = 'id', query = {} } = options;
  if (size === -1) {
    return {
      items: await repository.find(query),
    };
  }

  const countQuery = _.merge(
    query,
    lastCursor
      ? _.set(
          {},
          `where.${cursorColumn}`,
          cursorOrder === 'ASC' ? MoreThan(lastCursor) : LessThan(lastCursor),
        )
      : {},
    {
      order: {
        [orderColumn]: cursorOrder,
      },
    },
  );

  const itemsQuery = {
    ...countQuery,
    take: size,
  } as FindManyOptions;
  const items = await repository.find(itemsQuery);
  const total = await repository.count(countQuery);
  return { items, total };
};
