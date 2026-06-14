import type { Comparator } from "./compare.ts";
import { compareKeys } from "./compare.ts";

/**
 * Returns a deeply key-sorted copy of a value parsed from JSON.
 *
 * - Objects: keys are reordered with `compare` and their values are sorted
 *   recursively.
 * - Arrays: element order is preserved (it is meaningful in CloudFormation) but
 *   each element is still recursed into so objects nested in arrays get sorted.
 * - Everything else (strings, numbers, booleans, null) is returned unchanged.
 *
 * `compare` orders only the keys of the object passed in; every nested object is
 * sorted with the default alphabetical {@link compareKeys}. This is the seam the
 * root template object uses to apply its fixed section order while everything
 * deeper stays alphabetical.
 */
export function sortValue(value: unknown, compare: Comparator = compareKeys): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortValue(item));
  }

  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort(compare)) {
      sorted[key] = sortValue(source[key]);
    }
    return sorted;
  }

  return value;
}
