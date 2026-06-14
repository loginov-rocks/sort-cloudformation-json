import { createOrderedComparator } from "./compare.ts";

/**
 * The order of keys within a single output definition (a direct child of the
 * root `Outputs` section): `Description`, `Value`, `Export`, then every
 * remaining key alphabetically.
 *
 * This is the single place to read or amend the output entry order.
 *
 * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/outputs-section-structure.html
 */
export const OUTPUT_ENTRY_ORDER: readonly string[] = ["Description", "Value", "Export"];

/**
 * Comparator for the keys of an output definition object. Recognized keys are
 * ordered by their position in {@link OUTPUT_ENTRY_ORDER}; any other key is
 * placed after them and sorted alphabetically among the rest.
 */
export const compareOutputEntry = createOrderedComparator(OUTPUT_ENTRY_ORDER);
