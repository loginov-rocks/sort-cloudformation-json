import { describe, expect, it } from '@jest/globals';

import { compareParameterEntry, PARAMETER_ENTRY_ORDER } from './parameters.ts';

describe('compareParameterEntry', () => {
  it('orders Type first, then the conventional sequence', () => {
    expect(compareParameterEntry('Type', 'Description')).toBeLessThan(0);
    expect(compareParameterEntry('Default', 'AllowedValues')).toBeLessThan(0);
    expect(compareParameterEntry('MaxValue', 'Type')).toBeGreaterThan(0);
  });

  it('places recognized keys before any other key', () => {
    expect(compareParameterEntry('NoEcho', 'Custom')).toBeLessThan(0);
    expect(compareParameterEntry('Zzz', 'Type')).toBeGreaterThan(0);
  });

  it('sorts remaining keys alphabetically among themselves', () => {
    expect(compareParameterEntry('Apple', 'Banana')).toBeLessThan(0);
    expect(compareParameterEntry('Banana', 'Apple')).toBeGreaterThan(0);
  });

  it('sorts a shuffled parameter entry into the expected order', () => {
    const keys = ['NoEcho', 'Default', 'Description', 'AllowedValues', 'Type', 'Custom'];

    expect(keys.toSorted(compareParameterEntry)).toEqual([
      'Type',
      'Description',
      'Default',
      'AllowedValues',
      'NoEcho',
      'Custom',
    ]);
  });

  it('exposes the parameter entry order in one place', () => {
    expect(PARAMETER_ENTRY_ORDER).toEqual([
      'Type',
      'Description',
      'Default',
      'AllowedValues',
      'AllowedPattern',
      'ConstraintDescription',
      'MinLength',
      'MaxLength',
      'MinValue',
      'MaxValue',
      'NoEcho',
    ]);
  });
});
