import type { Comparator } from "./compare.ts";
import { compareKeys, createOrderedComparator } from "./compare.ts";

/**
 * The order of attributes within a single resource definition (a direct child
 * of the root `Resources` section). Listed attributes come first in this order;
 * any other key is placed after them alphabetically.
 *
 * Only `Type` and `Properties` reflect a firm convention. The remaining resource
 * attributes (`Condition`, `DependsOn`, the policies, `Metadata`) have no
 * AWS-blessed order — this constant is the single place to adjust them.
 *
 * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/resources-section-structure.html
 */
export const RESOURCE_ATTRIBUTE_ORDER: readonly string[] = [
  "Type",
  "Condition",
  "DependsOn",
  "Properties",
  "CreationPolicy",
  "UpdatePolicy",
  "UpdateReplacePolicy",
  "DeletionPolicy",
  "Metadata",
];

/**
 * Comparator for the keys of a resource definition object. Recognized
 * attributes are ordered by their position in {@link RESOURCE_ATTRIBUTE_ORDER};
 * any other key is placed after them and sorted alphabetically among the rest.
 */
export const compareResourceAttributes = createOrderedComparator(RESOURCE_ATTRIBUTE_ORDER);

/**
 * Builds a comparator for the logical IDs of the root `Resources` object that
 * groups resources by their `Type` value and orders alphabetically by logical ID
 * within each group. Both keys use the deterministic {@link compareKeys}.
 *
 * A resource whose `Type` is missing or not a string is treated as having an
 * empty-string type, so it sorts deterministically (before any real type) and is
 * never dropped or able to throw.
 */
export function compareResourcesByType(resources: Readonly<Record<string, unknown>>): Comparator {
  return (a, b) => {
    const byType = compareKeys(resourceType(resources[a]), resourceType(resources[b]));
    return byType !== 0 ? byType : compareKeys(a, b);
  };
}

function resourceType(resource: unknown): string {
  if (resource !== null && typeof resource === "object" && "Type" in resource) {
    const type = (resource as Record<string, unknown>).Type;
    if (typeof type === "string") {
      return type;
    }
  }
  return "";
}
