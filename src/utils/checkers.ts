import minimatch from 'minimatch';
import _ from 'lodash';

export const checkPatternMatchValues = (pattern: string, values: string[]) => {
  return values.some((value) => minimatch(value, pattern));
};

export const checkValueMatchPatterns = (value: string, patterns: string[]) => {
  return patterns.some((pattern) => minimatch(value, pattern));
};

export const getMatchedValues = (patterns: string[], values: string[]) => {
  let result = [];
  for (const pattern of patterns) {
    result = result.concat(values.filter((value) => minimatch(value, pattern)));
  }
  return _.uniq(result);
};
