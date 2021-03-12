import _ from 'lodash';
import {
  Brackets,
  FindManyOptions,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

export interface QueryPaginationOptions<K> {
  cursorColumn?: string;
  orderColumn?: string;
  search?: string;
  searchColumns?: string[];
  searchWithAlias?: boolean;
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
    searchColumns = ['id'],
    search = '',
    query = {},
    searchWithAlias = false,
  } = options;

  const customWhere = _.get(query, 'where');
  const customWhereFunctionHandler = (qb: SelectQueryBuilder<K>) => {
    if (_.isFunction(customWhere)) {
      qb.andWhere(new Brackets((subQb) => customWhere(subQb)));
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
      qb.andWhere(new Brackets(handleSubQb));
    }
  };

  const cursorQueryHandler = (qb: SelectQueryBuilder<K>) => {
    if (
      !(
        _.isNull(lastCursor) ||
        (!_.isNumber(lastCursor) && _.isEmpty(lastCursor))
      )
    ) {
      const query = `${cursorColumn} ${
        cursorOrder === 'ASC' ? '>' : '<'
      } :lastCursor`;
      if (searchWithAlias) {
        qb.andWhere((subQb) => {
          subQb.where(query, { lastCursor });
          return '';
        });
      } else {
        qb.andWhere(query, { lastCursor });
      }
    }
  };

  const takeQuery = {} as FindManyOptions<K>;
  const orderQuery = {
    order: {
      [orderColumn]: cursorOrder as 'ASC' | 'DESC',
    },
  } as FindManyOptions<K>;

  let itemsWhereConditions = {
    deletedAt: null,
  };
  let totalWhereConditions = {
    deletedAt: null,
  };

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
