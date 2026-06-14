import { createOrderedComparator } from './compare.ts';

/**
 * The order of top-level sections in a CloudFormation template, as documented
 * by AWS. Unlike everything nested below it, the root object follows this fixed
 * order rather than alphabetical sorting.
 *
 * This is the single place to read or amend the section order.
 *
 * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-anatomy.html
 */
export const TEMPLATE_SECTION_ORDER: readonly string[] = [
  'AWSTemplateFormatVersion',
  'Description',
  'Metadata',
  'Parameters',
  'Rules',
  'Mappings',
  'Conditions',
  'Transform',
  'Resources',
  'Outputs',
];

/**
 * Comparator for the keys of the root template object. Recognized sections are
 * ordered by their position in {@link TEMPLATE_SECTION_ORDER}; any unrecognized
 * key is placed after all recognized sections and sorted alphabetically among
 * the other unrecognized keys.
 */
export const compareTopLevelSections = createOrderedComparator(TEMPLATE_SECTION_ORDER);
