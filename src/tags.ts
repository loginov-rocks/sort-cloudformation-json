import { compareKeys } from "./compare.ts";

/** The key whose array value is the sole exception to preserving array order. */
const TAGS_KEY = "Tags";

/** A tag is an object with a string `Key`. */
function isTag(element: unknown): element is { Key: string } {
  return (
    element !== null &&
    typeof element === "object" &&
    "Key" in element &&
    typeof (element as Record<string, unknown>).Key === "string"
  );
}

/**
 * True when an array is safely recognizable as a CloudFormation tag list: it is
 * the value of a key named exactly `Tags` and every element is an object with a
 * string `Key`. Tag lists appear under many resource properties, so this is
 * matched by key name and element shape rather than by a fixed path.
 */
export function isTagList(key: string | undefined, value: readonly unknown[]): boolean {
  return key === TAGS_KEY && value.every(isTag);
}

/**
 * Returns a copy of a tag array ordered by each element's `Key`, using the
 * deterministic {@link compareKeys}. The sort is stable, so tags with an equal
 * `Key` keep their original relative order. No element is ever dropped or
 * altered — only the order changes.
 *
 * Callers must first confirm the array is a tag list with {@link isTagList}.
 */
export function sortTagsByKey(tags: readonly unknown[]): unknown[] {
  return [...tags].sort((a, b) => compareKeys((a as { Key: string }).Key, (b as { Key: string }).Key));
}
