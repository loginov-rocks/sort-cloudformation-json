import { describe, expect, it } from '@jest/globals';

import { isDependsOnList, sortDependsOn } from './dependsOn.ts';

describe('isDependsOnList', () => {
  const resourceDependsOn = ['Resources', 'MyResource', 'DependsOn'];

  it('is true for a resource DependsOn when every element is a string', () => {
    expect(isDependsOnList(resourceDependsOn, ['B', 'A'])).toBe(true);
  });

  it('is true for an empty resource DependsOn array', () => {
    expect(isDependsOnList(resourceDependsOn, [])).toBe(true);
  });

  it('is false when DependsOn is not a direct child of a resource', () => {
    // Anywhere other than ["Resources", <id>, "DependsOn"] is left untouched.
    expect(isDependsOnList(['Resources', 'X', 'Properties', 'DependsOn'], ['A'])).toBe(false);
    expect(isDependsOnList(['DependsOn'], ['A'])).toBe(false);
    expect(isDependsOnList(['Outputs', 'O', 'DependsOn'], ['A'])).toBe(false);
  });

  it('is false when the final key is not exactly \'DependsOn\'', () => {
    expect(isDependsOnList(['Resources', 'X', 'dependson'], ['A'])).toBe(false);
  });

  it('is false when any element is not a string', () => {
    expect(isDependsOnList(resourceDependsOn, ['A', 1])).toBe(false);
    expect(isDependsOnList(resourceDependsOn, ['A', { Ref: 'X' }])).toBe(false);
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
