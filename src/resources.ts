import { createOrderedComparator } from "./compare.ts";

/**
 * The order of attributes within a single resource definition (a direct child
 * of the root `Resources` section): `Type` first, then `Properties`, then every
 * remaining attribute (`DependsOn`, `Condition`, `DeletionPolicy`, `Metadata`,
 * etc.) alphabetically.
 *
 * This is the single place to read or amend the resource attribute order.
 *
 * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/resources-section-structure.html
 */
export const RESOURCE_ATTRIBUTE_ORDER: readonly string[] = ["Type", "Properties"];

/**
 * Comparator for the keys of a resource definition object. Recognized
 * attributes are ordered by their position in {@link RESOURCE_ATTRIBUTE_ORDER};
 * any other key is placed after them and sorted alphabetically among the rest.
 */
export const compareResourceAttributes = createOrderedComparator(RESOURCE_ATTRIBUTE_ORDER);
