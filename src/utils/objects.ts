import _ from 'lodash';

export const camelToSnake = (raw: Record<string, any>): Record<string, any> => {
  return Object.keys(raw).reduce((result, currentKey) => {
    result[_.snakeCase(currentKey)] = raw[currentKey];
    return result;
  }, {});
};

export const snakeToCamel = (raw: Record<string, any>): Record<string, any> => {
  return Object.keys(raw).reduce((result, currentKey) => {
    result[_.camelCase(currentKey)] = raw[currentKey];
    return result;
  }, {});
};
