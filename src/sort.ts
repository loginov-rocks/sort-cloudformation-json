import type { ComparatorResolver } from "./compare.ts";
import { compareKeys } from "./compare.ts";

/**
 * Returns a deeply key-sorted copy of a value parsed from JSON.
 *
 * - Objects: keys are reordered with the comparator `resolveComparator` returns
 *   for the object's `path`, and their values are sorted recursively.
 * - Arrays: element order is preserved (it is meaningful in CloudFormation) but
 *   each element is still recursed into so objects nested in arrays get sorted.
 *   Array indices are not part of the path — an array is transparent to it.
 * - Everything else (strings, numbers, booleans, null) is returned unchanged.
 *
 * `path` is the sequence of object keys traversed from the root to the current
 * value. It is the context `resolveComparator` uses to apply position-aware
 * rules (root section order, per-resource attribute order) while everything else
 * stays alphabetical. The default resolver sorts every level alphabetically.
 */
export function sortValue(
  value: unknown,
  resolveComparator: ComparatorResolver = () => compareKeys,
  path: readonly string[] = [],
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortValue(item, resolveComparator, path));
  }

  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const compare = resolveComparator(path, source);
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort(compare)) {
      sorted[key] = sortValue(source[key], resolveComparator, [...path, key]);
    }
    return sorted;
  }

  return value;
}
