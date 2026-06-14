import type { Comparator } from "./compare.ts";
import { compareKeys } from "./compare.ts";
import { compareOutputEntry } from "./outputs.ts";
import { compareResourceAttributes, compareResourcesByType } from "./resources.ts";
import { compareTopLevelSections } from "./sections.ts";

/**
 * Chooses the comparator for an object's keys based on its structural position
 * in a CloudFormation template, identified by `path` (the keys traversed from
 * the root to reach the object).
 *
 * - Root object (`path` is empty): the fixed section order.
 * - The root `Resources` object itself (`["Resources"]`): its logical-ID entries
 *   are grouped by each resource's `Type`, then alphabetical by logical ID.
 * - A direct child of the root `Resources` section (`["Resources", <id>]`): the
 *   fixed resource attribute order.
 * - A direct child of the root `Outputs` section (`["Outputs", <name>]`): the
 *   fixed output entry order.
 * - Everywhere else: plain alphabetical order.
 *
 * The position is matched strictly by path, so a `Type` or `Properties` key that
 * merely appears deeper in the tree is left to alphabetical sorting.
 */
export function resolveTemplateComparator(
  path: readonly string[],
  object: Readonly<Record<string, unknown>>,
): Comparator {
  if (path.length === 0) {
    return compareTopLevelSections;
  }

  if (path.length === 1 && path[0] === "Resources") {
    return compareResourcesByType(object);
  }

  if (path.length === 2 && path[0] === "Resources") {
    return compareResourceAttributes;
  }

  if (path.length === 2 && path[0] === "Outputs") {
    return compareOutputEntry;
  }

  return compareKeys;
}
