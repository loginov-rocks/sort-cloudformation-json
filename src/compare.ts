/** Orders two object keys; follows the `Array.prototype.sort` contract. */
export type Comparator = (a: string, b: string) => number;

/**
 * Resolves the comparator to use for an object's keys, given its path from the
 * root (the sequence of keys traversed to reach it) and the object itself. This
 * is the seam that lets structural rules — such as the root section order, the
 * per-resource attribute order, or ordering resources by their nested `Type` —
 * depend on *where* an object sits and, when needed, on its contents, while
 * everything else stays alphabetical.
 */
export type ComparatorResolver = (
  path: readonly string[],
  object: Readonly<Record<string, unknown>>,
) => Comparator;

/**
 * Comparator used to order object keys.
 *
 * Compares case-insensitively first, so keys read in dictionary order regardless
 * of capitalization — e.g. `AWS::SecretsManager::Secret` sorts before
 * `AWS::SQS::Queue`, rather than every uppercase letter sorting ahead of every
 * lowercase one. Keys that are equal ignoring case (e.g. `Type` and `type`) fall
 * back to a UTF-16 code-unit comparison, which keeps the ordering a deterministic
 * total order.
 *
 * Case folding uses `String.prototype.toLowerCase` (a fixed Unicode mapping) and
 * the final comparison uses the `<`/`>` operators, so the result is identical on
 * every machine. This deliberately avoids `localeCompare`, `toLocaleLowerCase`,
 * and `Intl.Collator`, whose ordering can vary by environment.
 *
 * Isolated here so the ordering rule can be swapped out later without touching
 * the traversal logic.
 */
export function compareKeys(a: string, b: string): number {
  const lowerA = a.toLowerCase();
  const lowerB = b.toLowerCase();

  if (lowerA < lowerB) {
    return -1;
  }
  if (lowerA > lowerB) {
    return 1;
  }

  // Equal ignoring case: break the tie by raw code unit so the order stays a
  // deterministic total order (e.g. `Type` consistently before `type`).
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

/**
 * Builds a comparator that places the keys listed in `order` first, in that
 * exact order, and sorts every remaining key alphabetically after them. Used to
 * express fixed-order rules (e.g. template sections, resource attributes) from a
 * single named list.
 */
export function createOrderedComparator(order: readonly string[]): Comparator {
  const rank = (key: string): number => {
    const index = order.indexOf(key);
    return index === -1 ? order.length : index;
  };

  return (a, b) => {
    const rankA = rank(a);
    const rankB = rank(b);

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    // Equal rank only happens when both keys are unrecognized (listed keys are
    // unique): fall back to plain alphabetical ordering.
    return compareKeys(a, b);
  };
}
