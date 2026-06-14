import { compareKeys } from './compare.ts';

/**
 * True when an array is safely recognizable as a `DependsOn` list to reorder.
 * Both conditions must hold:
 *
 * - Position: the array is the value of `DependsOn` sitting directly on a
 *   resource definition, i.e. the path is exactly
 *   `["Resources", <logicalID>, "DependsOn"]`. `DependsOn` only ever appears in
 *   this position in CloudFormation, so it is scoped there and nowhere else.
 * - Shape: every element is a string. A single-string `DependsOn` (also valid)
 *   is not an array and never reaches here; an array holding any non-string
 *   element is left to the normal array handling.
 *
 * `DependsOn` order is insignificant in CloudFormation, so sorting it is safe.
 */
export function isDependsOnList(path: readonly string[], value: readonly unknown[]): boolean {
  return isResourceDependsOnPath(path) && value.every(element => typeof element === 'string');
}

/**
 * Returns a copy of a `DependsOn` array sorted alphabetically with the
 * deterministic {@link compareKeys}. The sort is stable; no element is dropped
 * or altered — only the order changes.
 *
 * Callers must first confirm the array with {@link isDependsOnList}.
 */
export function sortDependsOn(dependsOn: readonly unknown[]): unknown[] {
  return dependsOn.toSorted((a, b) => compareKeys(a as string, b as string));
}

/**
 * True when `path` points exactly at a resource's `DependsOn`, i.e.
 * `["Resources", <logicalID>, "DependsOn"]`. The logical ID is any single key;
 * array indices never appear in the path, so a `DependsOn` nested anywhere
 * deeper lengthens the path and is correctly rejected.
 */
function isResourceDependsOnPath(path: readonly string[]): boolean {
  return path.length === 3 && path[0] === 'Resources' && path[2] === 'DependsOn';
}
