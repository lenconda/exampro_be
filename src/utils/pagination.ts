import { FindManyOptions, LessThan, MoreThan, Repository } from 'typeorm';
import _ from 'lodash';

export interface QueryPaginationOptions {
  cursorColumn?: string;
  query?: FindManyOptions;
}

export const queryWithPagination = async <T>(
  repository: Repository<any>,
  lastCursor: T,
  size: number,
  options: QueryPaginationOptions = {},
) => {
  const { cursorColumn = 'id', query = {} } = options;
  const cursorOrder = _.get(query, `order.${cursorColumn}`) || 'ASC';
  if (size === -1) {
    return {
      items: await repository.find(query),
    };
  }
  const countQuery = {
    where: {
      [cursorColumn]:
        cursorOrder === 'ASC' ? MoreThan(lastCursor) : LessThan(lastCursor),
    },
    ...query,
  } as FindManyOptions;
  const itemsQuery = {
    ...countQuery,
    take: size,
  } as FindManyOptions;
  const items = await repository.find(itemsQuery);
  const total = await repository.count(countQuery);
  return { items, total };
};
