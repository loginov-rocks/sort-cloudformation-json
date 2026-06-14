import { describe, expect, it } from '@jest/globals';

import { isDependsOnList, sortDependsOn } from './dependsOn.ts';

describe('isDependsOnList', () => {
  it('is true for the DependsOn key when every element is a string', () => {
    expect(isDependsOnList('DependsOn', ['B', 'A'])).toBe(true);
  });

  it('is true for an empty DependsOn array', () => {
    expect(isDependsOnList('DependsOn', [])).toBe(true);
  });

  it('is false when the key is not exactly \'DependsOn\'', () => {
    expect(isDependsOnList('dependson', ['A'])).toBe(false);
    expect(isDependsOnList(undefined, ['A'])).toBe(false);
  });

  it('is false when any element is not a string', () => {
    expect(isDependsOnList('DependsOn', ['A', 1])).toBe(false);
    expect(isDependsOnList('DependsOn', ['A', { Ref: 'X' }])).toBe(false);
  });
});

describe('sortDependsOn', () => {
  it('sorts logical IDs alphabetically and deterministically', () => {
    expect(sortDependsOn(['Web', 'App', 'Db'])).toEqual(['App', 'Db', 'Web']);
    // Uppercase sorts before lowercase under the deterministic comparison.
    expect(sortDependsOn(['beta', 'Alpha'])).toEqual(['Alpha', 'beta']);
  });

  it('does not mutate the input array', () => {
    const ids = ['B', 'A'];
    sortDependsOn(ids);
    expect(ids).toEqual(['B', 'A']);
  });
});
