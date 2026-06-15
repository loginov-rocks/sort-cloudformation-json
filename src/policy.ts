import type { Comparator } from './compare.ts';

import { createOrderedComparator } from './compare.ts';

/** A path segment standing for an array level; transparent when matching. */
const ARRAY_SEGMENT = '[*]';

/**
 * Concrete, curated paths whose value is an IAM-style policy document, each
 * given as the sequence of segments under a resource's `Properties` (so every
 * match is rooted at `Resources.<logicalID>.Properties`). A `[*]` segment
 * denotes an array level; because array indices are not part of a value's path
 * it is transparent when matching and stands for "every element" (as in
 * `Policies[*].PolicyDocument`). The grammar supports only this fixed array
 * segment, no open-ended wildcards.
 *
 * These names are reserved by CloudFormation/IAM convention to hold a policy
 * document at these exact paths, so the path is the binding - no resource `Type`
 * check is needed or performed. This is a deliberately curated set of safe bets,
 * not an exhaustive catalogue, and is the single place to add more once a
 * reserved name's shape and position are certain; ambiguous names (e.g.
 * `ResourcePolicy`) are deliberately left out.
 */
const POLICY_DOCUMENT_PATHS: readonly (readonly string[])[] = [
  ['PolicyDocument'], // IAM Policy/ManagedPolicy/RolePolicy/..., S3/SQS/SNS resource policies, Logs ResourcePolicy
  ['AssumeRolePolicyDocument'], // AWS::IAM::Role trust policy
  ['KeyPolicy'], // AWS::KMS::Key / AWS::KMS::ReplicaKey
  ['RepositoryPolicyText'], // AWS::ECR::Repository
  ['Policies', ARRAY_SEGMENT, 'PolicyDocument'], // inline policies on IAM Role/User/Group
];

/**
 * The order of keys within an IAM policy document, then any remaining key
 * alphabetically. This is the single place to amend the document order.
 */
export const POLICY_DOCUMENT_ORDER: readonly string[] = ['Version', 'Id', 'Statement'];

/**
 * The order of keys within a single IAM policy statement, then any remaining key
 * alphabetically. This is the single place to amend the statement order.
 */
export const POLICY_STATEMENT_ORDER: readonly string[] = [
  'Sid',
  'Effect',
  'Principal',
  'NotPrincipal',
  'Action',
  'NotAction',
  'Resource',
  'NotResource',
  'Condition',
];

/**
 * Comparator for the keys of an IAM policy document object. Recognized keys are
 * ordered by {@link POLICY_DOCUMENT_ORDER}; any other key is placed after them
 * and sorted alphabetically among the rest.
 */
export const comparePolicyDocument = createOrderedComparator(POLICY_DOCUMENT_ORDER);

/**
 * Comparator for the keys of a single IAM policy statement object. Recognized
 * keys are ordered by {@link POLICY_STATEMENT_ORDER}; any other key is placed
 * after them and sorted alphabetically among the rest.
 */
export const comparePolicyStatement = createOrderedComparator(POLICY_STATEMENT_ORDER);

/**
 * Resolves the comparator for an object at `path` whose contents are `object`,
 * when that position is an IAM-style policy document or one of its statements;
 * returns `undefined` for every other position (the caller then falls back to
 * alphabetical ordering).
 *
 * The binding is purely positional - see {@link POLICY_DOCUMENT_PATHS} - and
 * matched exactly, never by a subtree walk, so a matching key name anywhere else
 * is left alone. As the guard that keeps a path-only binding safe, an
 * intrinsic-function object (a lone `Ref` or `Fn::*` key, e.g. an `Fn::If`
 * selecting between documents) at a bound path is treated as not a literal
 * document and left alone. Values that are not objects (e.g. a
 * `RepositoryPolicyText` JSON string) never reach here, an absent `Statement`
 * simply has nothing to order, and a non-object statement entry is likewise left
 * untouched - all by falling through to the normal handling.
 */
export function resolvePolicyComparator(
  path: readonly string[],
  object: Readonly<Record<string, unknown>>,
): Comparator | undefined {
  if (isPolicyDocumentPath(path)) {
    return isIntrinsicObject(object) ? undefined : comparePolicyDocument;
  }
  if (isPolicyStatementPath(path)) {
    return isIntrinsicObject(object) ? undefined : comparePolicyStatement;
  }
  return undefined;
}

/** True when `object` is a CloudFormation intrinsic: a lone `Ref` or `Fn::*` key. */
function isIntrinsicObject(object: Readonly<Record<string, unknown>>): boolean {
  const keys = Object.keys(object);
  return keys.length === 1 && (keys[0] === 'Ref' || keys[0].startsWith('Fn::'));
}

/** True when `path` is one of the curated policy-document paths. */
function isPolicyDocumentPath(path: readonly string[]): boolean {
  if (path.length < 4 || path[0] !== 'Resources' || path[2] !== 'Properties') {
    return false;
  }
  const tail = path.slice(3);
  return POLICY_DOCUMENT_PATHS.some(pattern => matchesTail(pattern, tail));
}

/**
 * True when `path` is the `Statement` of a curated policy document: its last
 * segment is `Statement` and the path up to it is a policy-document path. A
 * single statement object and every element of a `Statement` array resolve to
 * this same path, since arrays are transparent to the path.
 */
function isPolicyStatementPath(path: readonly string[]): boolean {
  return path.at(-1) === 'Statement' && isPolicyDocumentPath(path.slice(0, -1));
}

/**
 * Compares a curated pattern to a path tail. The pattern's `[*]` array segments
 * are transparent - array indices never appear in a path - so they are dropped
 * before the segment-by-segment comparison.
 */
function matchesTail(pattern: readonly string[], tail: readonly string[]): boolean {
  const expected = pattern.filter(segment => segment !== ARRAY_SEGMENT);
  return (
    expected.length === tail.length && expected.every((segment, index) => segment === tail[index])
  );
}
