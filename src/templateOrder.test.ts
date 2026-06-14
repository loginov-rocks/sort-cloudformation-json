import { describe, expect, it } from '@jest/globals';

import { compareKeys } from './compare.ts';
import { compareOutputEntry } from './outputs.ts';
import { compareParameterEntry } from './parameters.ts';
import { compareResourceAttributes } from './resources.ts';
import { compareTopLevelSections } from './sections.ts';
import { resolveTemplateComparator } from './templateOrder.ts';

describe('resolveTemplateComparator', () => {
  it('uses the section order for the root object', () => {
    expect(resolveTemplateComparator([], {})).toBe(compareTopLevelSections);
  });

  it('uses the resource attribute order for a direct child of root Resources', () => {
    expect(resolveTemplateComparator(['Resources', 'MyBucket'], {})).toBe(compareResourceAttributes);
  });

  it('orders the root Resources object\'s entries by their nested Type', () => {
    const resources = {
      Alpha: { Type: 'AWS::SQS::Queue' },
      Beta: { Type: 'AWS::S3::Bucket' },
    };

    const compare = resolveTemplateComparator(['Resources'], resources);

    // S3 Bucket type sorts before SQS Queue type, so Beta comes before Alpha.
    expect(compare('Alpha', 'Beta')).toBeGreaterThan(0);
    expect(compare).not.toBe(compareKeys);
  });

  it('uses the output entry order for a direct child of root Outputs', () => {
    expect(resolveTemplateComparator(['Outputs', 'BucketArn'], {})).toBe(compareOutputEntry);
  });

  it('sorts below an output (e.g. inside Value/Export) alphabetically', () => {
    expect(resolveTemplateComparator(['Outputs', 'BucketArn', 'Export'], {})).toBe(compareKeys);
  });

  it('uses the parameter entry order for a direct child of root Parameters', () => {
    expect(resolveTemplateComparator(['Parameters', 'EnvName'], {})).toBe(compareParameterEntry);
  });

  it('sorts below a parameter (e.g. inside AllowedValues) alphabetically', () => {
    expect(resolveTemplateComparator(['Parameters', 'EnvName', 'Metadata'], {})).toBe(compareKeys);
  });

  it('sorts below a resource (e.g. inside Properties) alphabetically', () => {
    // A `Type` key here (SSM parameter, Route 53 record set, ...) must stay
    // alphabetical, never hoisted.
    expect(resolveTemplateComparator(['Resources', 'MyParam', 'Properties'], {})).toBe(compareKeys);
  });

  it('sorts a deeper key that merely equals \'Resources\' alphabetically', () => {
    expect(
      resolveTemplateComparator(['Resources', 'MyRes', 'Properties', 'Resources'], {}),
    ).toBe(compareKeys);
  });
});
