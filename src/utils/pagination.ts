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

  const baseQueryHandler = (qb: SelectQueryBuilder<K>, hasWhere = false) => {
    const handleSubQb = (subQb) => {
      for (const [index, searchColumn] of searchColumns.entries()) {
        if (index === 0) {
          subQb.where(`${searchColumn} LIKE :searchString`, {
            searchString: `%${search}%`,
          });
        } else {
          subQb.orWhere(`${searchColumn} LIKE :searchString`, {
            searchString: `%${search}%`,
          });
        }
      }
      return '';
    };
    if (search) {
      if (hasWhere) {
        qb.andWhere(handleSubQb);
      } else {
        qb.where(handleSubQb);
      }
    }
  };

  const takeQuery = {} as FindManyOptions<K>;
  const orderQuery = {
    order: {
      [orderColumn]: cursorOrder as 'ASC' | 'DESC',
    },
  } as FindManyOptions<K>;

  const countWhereQuery = {
    where: (qb: SelectQueryBuilder<K>) => {
      if (_.isFunction(customWhere)) {
        customWhere(qb);
      } else if (!_.isEmpty(customWhere)) {
        // qb.where(customWhere as FindConditions<K>);
      }
      baseQueryHandler(qb);
    },
  } as FindManyOptions<K>;
  const whereQuery = {
    where: (qb: SelectQueryBuilder<K>) => {
      if (_.isFunction(customWhere)) {
        customWhere(qb);
      } else {
        // qb.where(customWhere as FindConditions<K>);
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
  const totalQuery = {
    ..._.omit(query, ['where']),
    ...countWhereQuery,
    ...orderQuery,
  };

  const items = await repository.find(itemsQuery);
  const total = await repository.count(totalQuery);
  return { items, total };
};
