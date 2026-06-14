import { describe, expect, it } from '@jest/globals';

import { compareTopLevelSections, TEMPLATE_SECTION_ORDER } from './sections.ts';

describe('compareTopLevelSections', () => {
  it('orders recognized sections by their documented position, not alphabetically', () => {
    // "Parameters" comes before "Resources" by section order, even though
    // "Parameters" > "Resources" is false alphabetically the other way around.
    expect(compareTopLevelSections('Parameters', 'Resources')).toBeLessThan(0);
    expect(compareTopLevelSections('Outputs', 'Resources')).toBeGreaterThan(0);
  });

  it('places unrecognized keys after every recognized section', () => {
    expect(compareTopLevelSections('Resources', 'CustomKey')).toBeLessThan(0);
    expect(compareTopLevelSections('CustomKey', 'AWSTemplateFormatVersion')).toBeGreaterThan(0);
  });

  it('sorts unrecognized keys alphabetically among themselves', () => {
    expect(compareTopLevelSections('Apple', 'Banana')).toBeLessThan(0);
    expect(compareTopLevelSections('Banana', 'Apple')).toBeGreaterThan(0);
  });

  it('sorts a shuffled set of keys into documented order, unknown keys last', () => {
    const keys = [
      'Outputs',
      'ZebraExtension',
      'Resources',
      'AWSTemplateFormatVersion',
      'AlphaExtension',
      'Parameters',
    ];

    expect(keys.toSorted(compareTopLevelSections)).toEqual([
      'AWSTemplateFormatVersion',
      'Parameters',
      'Resources',
      'Outputs',
      'AlphaExtension',
      'ZebraExtension',
    ]);
  });

  it('exposes the full AWS-documented section order in one place', () => {
    expect(TEMPLATE_SECTION_ORDER).toEqual([
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
    ]);
  });
});
