import { describe, expect, it } from '@jest/globals';

import {
  comparePolicyDocument,
  comparePolicyStatement,
  POLICY_DOCUMENT_ORDER,
  POLICY_STATEMENT_ORDER,
  resolvePolicyComparator,
} from './policy.ts';

const PROPERTIES = ['Resources', 'Res', 'Properties'];

describe('comparePolicyDocument', () => {
  it('orders Version, Id, Statement, then the rest alphabetically', () => {
    const keys = ['Statement', 'Custom', 'Id', 'Version'];

    expect(keys.toSorted(comparePolicyDocument)).toEqual(['Version', 'Id', 'Statement', 'Custom']);
  });

  it('exposes the document order in one place', () => {
    expect(POLICY_DOCUMENT_ORDER).toEqual(['Version', 'Id', 'Statement']);
  });
});

describe('comparePolicyStatement', () => {
  it('orders the conventional statement keys, then the rest alphabetically', () => {
    const keys = [
      'Resource',
      'Condition',
      'Effect',
      'Zzz',
      'Action',
      'Sid',
      'Principal',
      'NotAction',
    ];

    expect(keys.toSorted(comparePolicyStatement)).toEqual([
      'Sid',
      'Effect',
      'Principal',
      'Action',
      'NotAction',
      'Resource',
      'Condition',
      'Zzz', // unlisted -> after recognized, alphabetical
    ]);
  });

  it('exposes the statement order in one place', () => {
    expect(POLICY_STATEMENT_ORDER).toEqual([
      'Sid',
      'Effect',
      'Principal',
      'NotPrincipal',
      'Action',
      'NotAction',
      'Resource',
      'NotResource',
      'Condition',
    ]);
  });
});

describe('resolvePolicyComparator', () => {
  it('binds the document comparator at every curated policy-document path', () => {
    for (const name of [
      'PolicyDocument',
      'AssumeRolePolicyDocument',
      'KeyPolicy',
      'RepositoryPolicyText',
    ]) {
      expect(resolvePolicyComparator([...PROPERTIES, name], {})).toBe(comparePolicyDocument);
    }
  });

  it('binds the document comparator for an inline Policies[*].PolicyDocument', () => {
    // Array indices are transparent to the path, so [*] adds no segment.
    expect(resolvePolicyComparator([...PROPERTIES, 'Policies', 'PolicyDocument'], {})).toBe(
      comparePolicyDocument,
    );
  });

  it('binds the statement comparator for a Statement inside any policy document', () => {
    expect(resolvePolicyComparator([...PROPERTIES, 'PolicyDocument', 'Statement'], {})).toBe(
      comparePolicyStatement,
    );
    expect(
      resolvePolicyComparator([...PROPERTIES, 'Policies', 'PolicyDocument', 'Statement'], {}),
    ).toBe(comparePolicyStatement);
  });

  it('returns undefined for a matching name found anywhere but a curated path', () => {
    // Ambiguous/uncurated name.
    expect(resolvePolicyComparator([...PROPERTIES, 'ResourcePolicy'], {})).toBeUndefined();
    // Not directly under Properties.
    expect(resolvePolicyComparator(['Resources', 'R', 'Metadata', 'PolicyDocument'], {})).toBeUndefined();
    // Deeper inside another property, not a curated path.
    expect(
      resolvePolicyComparator([...PROPERTIES, 'Other', 'PolicyDocument'], {}),
    ).toBeUndefined();
    // Top level.
    expect(resolvePolicyComparator(['PolicyDocument'], {})).toBeUndefined();
  });

  it('leaves an intrinsic-function object at a bound path alone (the safety guard)', () => {
    expect(
      resolvePolicyComparator([...PROPERTIES, 'PolicyDocument'], { 'Fn::If': [] }),
    ).toBeUndefined();
    expect(resolvePolicyComparator([...PROPERTIES, 'PolicyDocument'], { Ref: 'X' })).toBeUndefined();
    expect(
      resolvePolicyComparator([...PROPERTIES, 'PolicyDocument', 'Statement'], { 'Fn::Sub': 's' }),
    ).toBeUndefined();
    // A real document with a Version key is not mistaken for an intrinsic.
    expect(
      resolvePolicyComparator([...PROPERTIES, 'PolicyDocument'], {
        'Fn::If': [],
        'Version': '2012-10-17',
      }),
    ).toBe(comparePolicyDocument);
  });
});
