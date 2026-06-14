/** Orders two object keys; follows the `Array.prototype.sort` contract. */
export type Comparator = (a: string, b: string) => number;

/**
 * Comparator used to order object keys.
 *
 * Compares by UTF-16 code unit so the result is deterministic and identical on
 * every machine, independent of locale. This deliberately avoids
 * `String.prototype.localeCompare` and `Intl.Collator`, whose ordering can vary
 * by environment.
 *
 * Isolated here so the ordering rule can be swapped out later without touching
 * the traversal logic.
 */
export function compareKeys(a: string, b: string): number {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}
