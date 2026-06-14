import { describe, expect, it } from '@jest/globals';

import type { Comparator } from './compare.ts';

import { compareKeys } from './compare.ts';
import { sortValue } from './sort.ts';

/** Reverse of {@link compareKeys}; used to prove the resolver is consulted per object. */
const reverse: Comparator = (a, b) => (a < b ? 1 : (a > b ? -1 : 0));

/** Resolver that reverses only the root object's keys, leaving deeper levels alphabetical. */
const resolveRootReversed = (path: readonly string[]): Comparator =>
  path.length === 0 ? reverse : compareKeys;

describe('sortValue', () => {
  it('returns primitives unchanged', () => {
    expect(sortValue('AWS::S3::Bucket')).toBe('AWS::S3::Bucket');
    expect(sortValue(42)).toBe(42);
    expect(sortValue(true)).toBe(true);
    expect(sortValue(null)).toBeNull();
  });

  it('sorts the keys of a flat object', () => {
    // eslint-disable-next-line perfectionist/sort-objects -- intentionally unsorted test fixture
    const sorted = sortValue({ Type: 'AWS::S3::Bucket', DeletionPolicy: 'Retain' });

    expect(Object.keys(sorted as object)).toEqual(['DeletionPolicy', 'Type']);
  });

  it('sorts keys recursively in nested objects', () => {
    /* eslint-disable perfectionist/sort-objects -- intentionally unsorted test fixture */
    const template = {
      Resources: {
        Queue: {
          Type: 'AWS::SQS::Queue',
          Properties: { VisibilityTimeout: 30, QueueName: 'jobs' },
        },
      },
      AWSTemplateFormatVersion: '2010-09-09',
    };
    /* eslint-enable perfectionist/sort-objects */

    expect(sortValue(template)).toEqual({
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: {
        Queue: {
          Properties: { QueueName: 'jobs', VisibilityTimeout: 30 },
          Type: 'AWS::SQS::Queue',
        },
      },
    });
  });

  it('preserves array element order while sorting keys of nested objects', () => {
    /* eslint-disable perfectionist/sort-objects -- intentionally unsorted test fixture */
    const value = {
      Tags: [
        { Value: 'prod', Key: 'env' },
        { Value: 'team-a', Key: 'owner' },
      ],
    };
    /* eslint-enable perfectionist/sort-objects */

    const sorted = sortValue(value) as { Tags: Record<string, string>[] };

    // Element order is unchanged...
    expect(sorted.Tags.map(tag => tag.Key)).toEqual(['env', 'owner']);
    // ...but each element's keys are sorted.
    expect(sorted.Tags.map(tag => Object.keys(tag))).toEqual([
      ['Key', 'Value'],
      ['Key', 'Value'],
    ]);
  });

  it('recurses into arrays holding mixed objects and primitives', () => {
    /* eslint-disable perfectionist/sort-objects -- intentionally unsorted test fixture */
    const value = {
      Statement: [{ Sid: 'Allow', Effect: 'Allow', Action: 's3:*' }, '*', 1, null],
    };
    /* eslint-enable perfectionist/sort-objects */

    expect(sortValue(value)).toEqual({
      Statement: [{ Action: 's3:*', Effect: 'Allow', Sid: 'Allow' }, '*', 1, null],
    });
  });

  it('consults the resolver per object using its path, defaulting deeper levels', () => {
    // Reverse only the root object's keys; everything deeper stays alphabetical.
    const sorted = sortValue(
      // eslint-disable-next-line perfectionist/sort-objects -- intentionally unsorted test fixture
      { a: 1, b: 2, nested: { y: 1, x: 2 } },
      resolveRootReversed,
    ) as Record<string, unknown>;

    expect(Object.keys(sorted)).toEqual(['nested', 'b', 'a']);
    expect(Object.keys(sorted.nested as object)).toEqual(['x', 'y']);
  });

  it('treats arrays as transparent to the path (indices are not path segments)', () => {
    const seen: string[][] = [];
    const resolve = (path: readonly string[]): Comparator => {
      seen.push([...path]);
      return compareKeys;
    };

    sortValue({ list: [{ b: 1 }, { a: 2 }] }, resolve);

    // The objects inside the array are both reached at path ["list"], not
    // ["list", 0] / ["list", 1].
    expect(seen).toContainEqual(['list']);
    expect(seen).toEqual([[], ['list'], ['list']]);
  });

  it('reorders a recognized Tags array by Key while leaving other arrays in place', () => {
    /* eslint-disable perfectionist/sort-objects -- intentionally unsorted test fixture */
    const value = {
      Tags: [
        { Value: 'team-a', Key: 'owner' },
        { Value: 'prod', Key: 'env' },
      ],
      NotTags: [{ Key: 'z' }, { Key: 'a' }],
    };
    /* eslint-enable perfectionist/sort-objects */

    const sorted = sortValue(value) as {
      NotTags: Record<string, string>[];
      Tags: Record<string, string>[];
    };

    // Tags reordered by Key, and each tag's own keys sorted alphabetically.
    expect(sorted.Tags).toEqual([
      { Key: 'env', Value: 'prod' },
      { Key: 'owner', Value: 'team-a' },
    ]);
    // A same-shaped array under a different key keeps its original order.
    expect(sorted.NotTags.map(item => item.Key)).toEqual(['z', 'a']);
  });

  it('leaves a Tags array untouched when an element is not tag-shaped', () => {
    const value = { Tags: [{ Key: 'b' }, { NotAKey: 'x' }] };

    const sorted = sortValue(value) as { Tags: Record<string, unknown>[] };

    expect(sorted.Tags).toEqual([{ Key: 'b' }, { NotAKey: 'x' }]);
  });

  it('sorts a DependsOn array of strings alphabetically', () => {
    const sorted = sortValue({ DependsOn: ['Web', 'App', 'Db'] }) as { DependsOn: string[] };

    expect(sorted.DependsOn).toEqual(['App', 'Db', 'Web']);
  });

  it('leaves a DependsOn array untouched when an element is not a string', () => {
    const value = { DependsOn: ['Web', { Ref: 'App' }] };

    const sorted = sortValue(value) as { DependsOn: unknown[] };

    expect(sorted.DependsOn).toEqual(['Web', { Ref: 'App' }]);
  });

  it('leaves a single-string DependsOn value untouched', () => {
    const sorted = sortValue({ DependsOn: 'App' }) as { DependsOn: string };

    expect(sorted.DependsOn).toBe('App');
  });

  it('does not mutate the input value', () => {
    // eslint-disable-next-line perfectionist/sort-objects -- intentionally unsorted test fixture
    const template = { B: 1, A: 2 };

    sortValue(template);

    expect(Object.keys(template)).toEqual(['B', 'A']);
  });
});
