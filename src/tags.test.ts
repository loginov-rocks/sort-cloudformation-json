import { describe, expect, it } from '@jest/globals';

import { isTagList, sortTagsByKey } from './tags.ts';

describe('isTagList', () => {
  const propertiesTags = ['Resources', 'MyBucket', 'Properties', 'Tags'];

  it('is true for Properties.Tags when every element is an object with a string Key', () => {
    expect(isTagList(propertiesTags, [{ Key: 'env', Value: 'prod' }, { Key: 'team' }])).toBe(true);
  });

  it('is true for an empty Properties.Tags array', () => {
    expect(isTagList(propertiesTags, [])).toBe(true);
  });

  it('is false when the Tags array is not directly under a resource Properties', () => {
    // Deeper inside Properties, e.g. TagSpecifications[].Tags (array indices are
    // not part of the path, so the inner Tags path is one segment longer).
    expect(
      isTagList(['Resources', 'Inst', 'Properties', 'TagSpecifications', 'Tags'], [{ Key: 'env' }]),
    ).toBe(false);
    // Under Metadata, Outputs, or the top level.
    expect(isTagList(['Resources', 'Inst', 'Metadata', 'Tags'], [{ Key: 'env' }])).toBe(false);
    expect(isTagList(['Outputs', 'Out', 'Tags'], [{ Key: 'env' }])).toBe(false);
    expect(isTagList(['Tags'], [{ Key: 'env' }])).toBe(false);
  });

  it('is false when the final key is not exactly \'Tags\'', () => {
    expect(isTagList(['Resources', 'X', 'Properties', 'NotTags'], [{ Key: 'env' }])).toBe(false);
  });

  it('is false when any element is not tag-shaped', () => {
    expect(isTagList(propertiesTags, [{ Key: 'env' }, 'oops'])).toBe(false); // not an object
    expect(isTagList(propertiesTags, [{ Key: 'env' }, null])).toBe(false); // null
    expect(isTagList(propertiesTags, [{ Value: 'x' }])).toBe(false); // missing Key
    expect(isTagList(propertiesTags, [{ Key: 42 }])).toBe(false); // non-string Key
  });
});

describe('sortTagsByKey', () => {
  it('orders tags by their Key deterministically', () => {
    const tags = [
      { Key: 'owner', Value: 'team-a' },
      { Key: 'env', Value: 'prod' },
      { Key: 'App', Value: 'web' },
    ];

    expect(sortTagsByKey(tags)).toEqual([
      { Key: 'App', Value: 'web' }, // uppercase sorts before lowercase
      { Key: 'env', Value: 'prod' },
      { Key: 'owner', Value: 'team-a' },
    ]);
  });

  it('is stable: equal Keys keep their original relative order', () => {
    const tags = [
      { Key: 'env', Value: 'first' },
      { Key: 'env', Value: 'second' },
      { Key: 'env', Value: 'third' },
    ];

    expect(sortTagsByKey(tags)).toEqual(tags);
  });

  it('does not mutate the input array', () => {
    const tags = [{ Key: 'b' }, { Key: 'a' }];
    sortTagsByKey(tags);
    expect(tags.map(tag => tag.Key)).toEqual(['b', 'a']);
  });
});
