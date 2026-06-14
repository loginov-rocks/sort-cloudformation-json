import { compareKeys } from "./compare.ts";

/**
 * Returns a deeply key-sorted copy of a value parsed from JSON.
 *
 * - Objects: keys are reordered with {@link compareKeys} and their values are
 *   sorted recursively.
 * - Arrays: element order is preserved (it is meaningful in CloudFormation) but
 *   each element is still recursed into so objects nested in arrays get sorted.
 * - Everything else (strings, numbers, booleans, null) is returned unchanged.
 */
export function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort(compareKeys)) {
      sorted[key] = sortValue(source[key]);
    }
    return sorted;
  }

  return value;
}
