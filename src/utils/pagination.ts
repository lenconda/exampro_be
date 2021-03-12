import _ from 'lodash';
import { FindManyOptions, Repository, SelectQueryBuilder } from 'typeorm';

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

  const customWhereFunctionHandler = (qb: SelectQueryBuilder<K>) => {
    if (_.isFunction(customWhere)) {
      customWhere(qb);
    }
  };

  const searchQueryHandler = (qb: SelectQueryBuilder<K>) => {
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
      qb.andWhere(handleSubQb);
    }
  };

  const cursorQueryHandler = (qb: SelectQueryBuilder<K>) => {
    if (!_.isNull(lastCursor) && !_.isEmpty(lastCursor)) {
      qb.andWhere((subQb) => {
        subQb.where(
          `${cursorColumn} ${cursorOrder === 'ASC' ? '>' : '<'} :lastCursor`,
          { lastCursor },
        );
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

  let itemsWhereConditions = {};
  let totalWhereConditions = {};

  if (_.isObject(customWhere) && !_.isFunction(customWhere)) {
    itemsWhereConditions = _.merge(itemsWhereConditions, customWhere);
    totalWhereConditions = _.merge(totalWhereConditions, customWhere);
  }

  const totalWhereQuery = {
    where: (qb: SelectQueryBuilder<K>) => {
      qb.where(totalWhereConditions);
      searchQueryHandler(qb);
      customWhereFunctionHandler(qb);
      cursorQueryHandler(qb);
    },
  } as FindManyOptions<K>;
  const itemsWhereQuery = {
    where: (qb: SelectQueryBuilder<K>) => {
      qb.where(itemsWhereConditions);
      searchQueryHandler(qb);
      customWhereFunctionHandler(qb);
      cursorQueryHandler(qb);
    },
  } as FindManyOptions<K>;

  if (size !== -1) {
    takeQuery.take = size;
  }

  const itemsQuery = {
    ..._.omit(query, ['where']),
    ...itemsWhereQuery,
    ...takeQuery,
    ...orderQuery,
  } as FindManyOptions;
  const totalQuery = {
    ..._.omit(query, ['where']),
    ...totalWhereQuery,
    ...orderQuery,
  };

  const items = await repository.find(itemsQuery);
  const total = await repository.count(totalQuery);
  return { items, total };
};
