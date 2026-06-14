import { createOrderedComparator } from "./compare.ts";

/**
 * The order of keys within a single parameter definition (a direct child of the
 * root `Parameters` section): `Type` first, then the rest in a conventional
 * order, then any remaining key alphabetically.
 *
 * Unlike the top-level section order, AWS does not document a parameter field
 * order — `Type` first is the only near-universal convention; the rest below is
 * just a sensible default. This constant is the single place to amend it.
 *
 * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/parameters-section-structure.html
 */
export const PARAMETER_ENTRY_ORDER: readonly string[] = [
  "Type",
  "Description",
  "Default",
  "AllowedValues",
  "AllowedPattern",
  "ConstraintDescription",
  "MinLength",
  "MaxLength",
  "MinValue",
  "MaxValue",
  "NoEcho",
];

/**
 * Comparator for the keys of a parameter definition object. Recognized keys are
 * ordered by their position in {@link PARAMETER_ENTRY_ORDER}; any other key is
 * placed after them and sorted alphabetically among the rest.
 */
export const compareParameterEntry = createOrderedComparator(PARAMETER_ENTRY_ORDER);
