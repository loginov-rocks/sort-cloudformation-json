import { describe, expect, it } from '@jest/globals';

import type { Comparator } from './compare.ts';

import { compareKeys } from './compare.ts';
import { sortValue } from './sort.ts';
import { resolveTemplateComparator } from './templateOrder.ts';

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

  it('reorders Resources.<id>.Properties.Tags by Key, but not a deeper Tags', () => {
    /* eslint-disable perfectionist/sort-objects -- intentionally unsorted test fixture */
    const value = {
      Resources: {
        Instance: {
          Type: 'AWS::EC2::Instance',
          Properties: {
            Tags: [
              { Value: 'team-a', Key: 'owner' },
              { Value: 'prod', Key: 'env' },
            ],
            // Tags nested deeper inside Properties must keep their order.
            TagSpecifications: [{ Tags: [{ Key: 'z' }, { Key: 'a' }] }],
          },
        },
      },
    };
    /* eslint-enable perfectionist/sort-objects */

    const sorted = sortValue(value) as {
      Resources: {
        Instance: {
          Properties: {
            Tags: { Key: string; Value: string }[];
            TagSpecifications: { Tags: { Key: string }[] }[];
          };
        };
      };
    };
    const { Properties } = sorted.Resources.Instance;

    // Properties.Tags reordered by Key, each tag's own keys sorted alphabetically.
    expect(Properties.Tags).toEqual([
      { Key: 'env', Value: 'prod' },
      { Key: 'owner', Value: 'team-a' },
    ]);
    // The deeper TagSpecifications[].Tags keeps its original element order.
    expect(Properties.TagSpecifications[0].Tags.map(tag => tag.Key)).toEqual(['z', 'a']);
  });

  it('leaves a Tags array untouched when an element is not tag-shaped', () => {
    /* eslint-disable perfectionist/sort-objects -- intentionally unsorted test fixture */
    const value = {
      Resources: { R: { Type: 'X', Properties: { Tags: [{ Key: 'b' }, { NotAKey: 'x' }] } } },
    };
    /* eslint-enable perfectionist/sort-objects */

    const sorted = sortValue(value) as {
      Resources: { R: { Properties: { Tags: Record<string, unknown>[] } } };
    };

    expect(sorted.Resources.R.Properties.Tags).toEqual([{ Key: 'b' }, { NotAKey: 'x' }]);
  });

  it('does not reorder a Tags array that is not under a resource Properties', () => {
    const value = { Tags: [{ Key: 'z' }, { Key: 'a' }] };

    const sorted = sortValue(value) as { Tags: { Key: string }[] };

    expect(sorted.Tags.map(tag => tag.Key)).toEqual(['z', 'a']);
  });

  it('sorts a resource DependsOn array of strings alphabetically', () => {
    const value = { Resources: { R: { DependsOn: ['Web', 'App', 'Db'], Type: 'X' } } };

    const sorted = sortValue(value) as {
      Resources: { R: { DependsOn: string[] } };
    };

    expect(sorted.Resources.R.DependsOn).toEqual(['App', 'Db', 'Web']);
  });

  it('leaves a resource DependsOn array untouched when an element is not a string', () => {
    const value = { Resources: { R: { DependsOn: ['Web', { Ref: 'App' }], Type: 'X' } } };

    const sorted = sortValue(value) as {
      Resources: { R: { DependsOn: unknown[] } };
    };

    expect(sorted.Resources.R.DependsOn).toEqual(['Web', { Ref: 'App' }]);
  });

  it('leaves a single-string resource DependsOn value untouched', () => {
    const value = { Resources: { R: { DependsOn: 'App', Type: 'X' } } };

    const sorted = sortValue(value) as {
      Resources: { R: { DependsOn: string } };
    };

    expect(sorted.Resources.R.DependsOn).toBe('App');
  });

  it('does not reorder a DependsOn array that is not a direct child of a resource', () => {
    const value = { DependsOn: ['Web', 'App', 'Db'] };

    const sorted = sortValue(value) as { DependsOn: string[] };

    expect(sorted.DependsOn).toEqual(['Web', 'App', 'Db']);
  });

  it('orders an IAM policy document and its statement keys, statement array order kept', () => {
    /* eslint-disable perfectionist/sort-objects -- intentionally unsorted test fixture */
    const value = {
      Resources: {
        Policy: {
          Type: 'AWS::S3::BucketPolicy',
          Properties: {
            PolicyDocument: {
              Statement: [
                {
                  Resource: '*',
                  Effect: 'Allow',
                  Action: 's3:GetObject',
                  Sid: 'Second',
                  Principal: { AWS: '*' },
                },
                { Effect: 'Deny', Sid: 'First' },
              ],
              Version: '2012-10-17',
            },
          },
        },
      },
    };
    /* eslint-enable perfectionist/sort-objects */

    const policyDocument = (
      sortValue(value, resolveTemplateComparator) as {
        Resources: {
          Policy: { Properties: { PolicyDocument: { Statement: Record<string, unknown>[] } } };
        };
      }
    ).Resources.Policy.Properties.PolicyDocument;

    // Document keys: Version before Statement.
    expect(Object.keys(policyDocument)).toEqual(['Version', 'Statement']);
    // Statement array order is preserved (the original 'Second' then 'First')...
    expect(policyDocument.Statement.map(statement => statement.Sid)).toEqual(['Second', 'First']);
    // ...but each statement's own keys follow the statement order.
    expect(Object.keys(policyDocument.Statement[0])).toEqual([
      'Sid',
      'Effect',
      'Principal',
      'Action',
      'Resource',
    ]);
  });

  it('orders a single (non-array) Statement object inside a policy document', () => {
    /* eslint-disable perfectionist/sort-objects -- intentionally unsorted test fixture */
    const value = {
      Resources: {
        Role: {
          Type: 'AWS::IAM::Role',
          Properties: {
            AssumeRolePolicyDocument: {
              Statement: { Action: 'sts:AssumeRole', Effect: 'Allow', Principal: { Service: 'x' } },
              Version: '2012-10-17',
            },
          },
        },
      },
    };
    /* eslint-enable perfectionist/sort-objects */

    const statement = (
      sortValue(value, resolveTemplateComparator) as {
        Resources: {
          Role: { Properties: { AssumeRolePolicyDocument: { Statement: Record<string, unknown> } } };
        };
      }
    ).Resources.Role.Properties.AssumeRolePolicyDocument.Statement;

    expect(Object.keys(statement)).toEqual(['Effect', 'Principal', 'Action']);
  });

  it('orders every inline Policies[*].PolicyDocument and its statements', () => {
    /* eslint-disable perfectionist/sort-objects -- intentionally unsorted test fixture */
    const value = {
      Resources: {
        Role: {
          Type: 'AWS::IAM::Role',
          Properties: {
            Policies: [
              {
                PolicyDocument: {
                  Statement: [{ Resource: '*', Effect: 'Allow', Action: 's3:*' }],
                  Version: '2012-10-17',
                },
                PolicyName: 'inline',
              },
            ],
          },
        },
      },
    };
    /* eslint-enable perfectionist/sort-objects */

    const policyDocument = (
      sortValue(value, resolveTemplateComparator) as {
        Resources: {
          Role: {
            Properties: {
              Policies: { PolicyDocument: { Statement: Record<string, unknown>[] } }[];
            };
          };
        };
      }
    ).Resources.Role.Properties.Policies[0].PolicyDocument;

    // The array element's PolicyDocument is in scope: Version before Statement,
    // and each statement's keys follow the statement order.
    expect(Object.keys(policyDocument)).toEqual(['Version', 'Statement']);
    expect(Object.keys(policyDocument.Statement[0])).toEqual(['Effect', 'Action', 'Resource']);
  });

  it('leaves an intrinsic-function policy document alone (the safety guard)', () => {
    /* eslint-disable perfectionist/sort-objects -- intentionally unsorted test fixture */
    const value = {
      Resources: {
        Cond: {
          Type: 'AWS::IAM::Role',
          Properties: {
            AssumeRolePolicyDocument: {
              'Fn::If': ['UseA', { Version: 'a', Statement: [] }, { Version: 'b', Statement: [] }],
            },
          },
        },
      },
    };
    /* eslint-enable perfectionist/sort-objects */

    const document = (
      sortValue(value, resolveTemplateComparator) as {
        Resources: {
          Cond: { Properties: { AssumeRolePolicyDocument: { 'Fn::If': [string, ...object[]] } } };
        };
      }
    ).Resources.Cond.Properties.AssumeRolePolicyDocument;

    // The Fn::If object is not treated as a document; the branch documents it
    // selects between are off any curated path, so they stay alphabetical
    // (Statement before Version), proving no policy ordering was applied.
    expect(Object.keys(document)).toEqual(['Fn::If']);
    expect(Object.keys(document['Fn::If'][1])).toEqual(['Statement', 'Version']);
  });

  it('is robust when a policy document is not an object or a statement is not an object', () => {
    /* eslint-disable perfectionist/sort-objects -- intentionally unsorted test fixture */
    const value = {
      Resources: {
        Weird: {
          Type: 'AWS::S3::BucketPolicy',
          Properties: {
            // Not an object: left untouched.
            PolicyDocument: 'see-attached',
          },
        },
        Mixed: {
          Type: 'AWS::IAM::Role',
          Properties: {
            AssumeRolePolicyDocument: {
              // A non-object statement entry must pass through unchanged.
              Statement: ['*', { Effect: 'Allow', Action: 'sts:AssumeRole' }],
              Version: '2012-10-17',
            },
          },
        },
      },
    };
    /* eslint-enable perfectionist/sort-objects */

    const result = sortValue(value, resolveTemplateComparator) as {
      Resources: {
        Mixed: { Properties: { AssumeRolePolicyDocument: { Statement: unknown[] } } };
        Weird: { Properties: { PolicyDocument: unknown } };
      };
    };

    expect(result.Resources.Weird.Properties.PolicyDocument).toBe('see-attached');
    const { Statement } = result.Resources.Mixed.Properties.AssumeRolePolicyDocument;
    expect(Statement[0]).toBe('*');
    expect(Object.keys(Statement[1] as object)).toEqual(['Effect', 'Action']);
  });

  it('does not mutate the input value', () => {
    // eslint-disable-next-line perfectionist/sort-objects -- intentionally unsorted test fixture
    const template = { B: 1, A: 2 };

    sortValue(template);

    expect(Object.keys(template)).toEqual(['B', 'A']);
  });
});
