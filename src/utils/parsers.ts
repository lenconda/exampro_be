import { IRole } from 'src/initializers';

export const parseRolesTree = (
  trees: Array<IRole>,
  previousPath: Array<string> = [],
) => {
  let result = [];
  for (const tree of trees) {
    const { name, children = [] } = tree;
    const currentPath = previousPath.concat(name);
    if (children.length === 0) {
      result.push({ id: currentPath.join('/') });
    } else {
      for (const child of children) {
        result = result.concat(parseRolesTree([child], currentPath));
      }
    }
  }
  return result;
};
