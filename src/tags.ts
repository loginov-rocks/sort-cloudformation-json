import { compareKeys } from './compare.ts';

/**
 * True when an array is safely recognizable as a CloudFormation tag list to
 * reorder by `Key`. Both conditions must hold:
 *
 * - Position: the array is the value of `Tags` sitting directly under a
 *   resource's `Properties`, i.e. the path is exactly
 *   `["Resources", <logicalID>, "Properties", "Tags"]`. A `Tags` key anywhere
 *   else — deeper inside `Properties` (e.g. `TagSpecifications[].Tags`), or under
 *   `Metadata`, `Parameters`, `Outputs`, or the top level — is deliberately left
 *   to the normal array handling and never reordered.
 * - Shape: every element is an object with a string `Key`. If any element does
 *   not fit, the whole array is left untouched.
 */
export function isTagList(path: readonly string[], value: readonly unknown[]): boolean {
  return isPropertiesTagsPath(path) && value.every(isTag);
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
  return tags.toSorted((a, b) => compareKeys((a as { Key: string }).Key, (b as { Key: string }).Key));
}

/**
 * True when `path` points exactly at a resource's `Properties.Tags`, i.e.
 * `["Resources", <logicalID>, "Properties", "Tags"]`. The logical ID is any
 * single key; array indices never appear in the path, so a deeper
 * `TagSpecifications[].Tags` lengthens the path and is correctly rejected.
 */
function isPropertiesTagsPath(path: readonly string[]): boolean {
  return (
    path.length === 4
    && path[0] === 'Resources'
    && path[2] === 'Properties'
    && path[3] === 'Tags'
  );
}

/** A tag is an object with a string `Key`. */
function isTag(element: unknown): element is { Key: string } {
  return (
    element !== null
    && typeof element === 'object'
    && 'Key' in element
    && typeof (element as Record<string, unknown>).Key === 'string'
  );
}
