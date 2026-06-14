import type { Comparator } from "./compare.ts";
import { compareKeys } from "./compare.ts";
import { compareResourceAttributes } from "./resources.ts";
import { compareTopLevelSections } from "./sections.ts";

/**
 * Chooses the comparator for an object's keys based on its structural position
 * in a CloudFormation template, identified by `path` (the keys traversed from
 * the root to reach the object).
 *
 * - Root object (`path` is empty): the fixed section order.
 * - A direct child of the root `Resources` section (`["Resources", <id>]`): the
 *   fixed resource attribute order.
 * - Everywhere else: plain alphabetical order.
 *
 * The position is matched strictly by path, so a `Type` or `Properties` key that
 * merely appears deeper in the tree is left to alphabetical sorting.
 */
export function resolveTemplateComparator(path: readonly string[]): Comparator {
  if (path.length === 0) {
    return compareTopLevelSections;
  }

  if (path.length === 2 && path[0] === "Resources") {
    return compareResourceAttributes;
  }

  return compareKeys;
}
