import { compareKeys } from "./compare.ts";

/** A second key (alongside `Tags`) whose array value may be reordered. */
const DEPENDS_ON_KEY = "DependsOn";

/**
 * True when an array is safely recognizable as a `DependsOn` list: it is the
 * value of a key named exactly `DependsOn` and every element is a string.
 * `DependsOn` order is insignificant in CloudFormation, so sorting is safe.
 *
 * Like the tag list, this is matched by key name rather than a fixed path. A
 * single-string `DependsOn` (also valid) is not an array and never reaches here.
 */
export function isDependsOnList(key: string | undefined, value: readonly unknown[]): boolean {
  return key === DEPENDS_ON_KEY && value.every((element) => typeof element === "string");
}

/**
 * Returns a copy of a `DependsOn` array sorted alphabetically with the
 * deterministic {@link compareKeys}. The sort is stable; no element is dropped
 * or altered — only the order changes.
 *
 * Callers must first confirm the array with {@link isDependsOnList}.
 */
export function sortDependsOn(dependsOn: readonly unknown[]): unknown[] {
  return [...dependsOn].sort((a, b) => compareKeys(a as string, b as string));
}
