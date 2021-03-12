import _ from 'lodash';
import {
  FindConditions,
  FindManyOptions,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

export interface QueryPaginationOptions<K> {
  cursorColumn?: string;
  orderColumn?: string;
  search?: string;
  searchColumns?: string[];
  query?: FindManyOptions<K>;
}

export const queryWithPagination = async <T, K>(
  repository: Repository<K>,
  lastCursor: T = null,
  cursorOrder: 'ASC' | 'DESC',
  size: number,
  options: QueryPaginationOptions<K> = {},
): Promise<{ items: K[]; total?: number }> => {
  const {
    cursorColumn = 'id',
    orderColumn = cursorColumn,
    searchColumns = [],
    search = '',
    query = {},
  } = options;

  const customWhere = _.get(query, 'where');

  const baseQueryHandler = (qb: SelectQueryBuilder<K>) => {
    if (search) {
      qb.where((subQb) => {
        for (const searchColumn of searchColumns) {
          subQb.orWhere(`${searchColumn} LIKE :searchString`, {
            searchString: `%${search}%`,
          });
        }
        return '';
      });
    }
  };

  const takeQuery = {} as FindManyOptions<K>;
  const orderQuery = {
    order: {
      [orderColumn]: cursorOrder as 'ASC' | 'DESC',
    },
  } as FindManyOptions<K>;
  const countWhereQuery = {
    where: baseQueryHandler,
  } as FindManyOptions<K>;
  const whereQuery = {
    where: (qb: SelectQueryBuilder<K>) => {
      if (_.isFunction(customWhere)) {
        customWhere(qb);
      } else {
        qb.where(customWhere as FindConditions<K>);
      }
      if (lastCursor) {
        qb.andWhere(
          `${cursorColumn} ${cursorOrder === 'ASC' ? '>' : '<'} :lastCursor`,
          { lastCursor },
        );
      }
      baseQueryHandler(qb);
    },
  } as FindManyOptions<K>;

  if (size !== -1) {
    takeQuery.take = size;
  }

  const itemsQuery = {
    ..._.omit(query, ['where']),
    ...whereQuery,
    ...takeQuery,
    ...orderQuery,
  } as FindManyOptions;
  console.log(itemsQuery);
  const items = await repository.find(itemsQuery);
  const total = await repository.count(countWhereQuery);
  return { items, total };
};
