import { describe, expect, it } from '@jest/globals';

import { compareKeys } from './compare.ts';

describe('compareKeys', () => {
  it('returns -1 when the first key sorts before the second', () => {
    expect(compareKeys('a', 'b')).toBe(-1);
  });

  it('returns 1 when the first key sorts after the second', () => {
    expect(compareKeys('b', 'a')).toBe(1);
  });

  it('returns 0 for equal keys', () => {
    expect(compareKeys('Resources', 'Resources')).toBe(0);
  });

  it('compares case-insensitively, so dictionary order ignores capitalization', () => {
    // 'access' before 'Bucket' (a < b), unlike a raw code-unit sort where every
    // uppercase letter precedes every lowercase one.
    expect(compareKeys('Bucket', 'access')).toBe(1);
    expect(compareKeys('access', 'Bucket')).toBe(-1);
    // The motivating case: SecretsManager before SQS.
    expect(compareKeys('AWS::SecretsManager::Secret', 'AWS::SQS::Queue')).toBe(-1);
  });

  it('breaks a case-only tie by code unit, deterministically', () => {
    // Equal ignoring case: uppercase sorts before lowercase as the tie-break.
    expect(compareKeys('Type', 'type')).toBe(-1);
    expect(compareKeys('type', 'Type')).toBe(1);
  });

  it('produces a stable, locale-independent ordering when used with sort()', () => {
    const keys = ['Outputs', 'Resources', 'Parameters', 'AWSTemplateFormatVersion'];

    expect(keys.toSorted(compareKeys)).toEqual([
      'AWSTemplateFormatVersion',
      'Outputs',
      'Parameters',
      'Resources',
    ]);
  });
});
