# Sorting Rules

## Introduction

This document defines how CloudFormation JSON templates are sorted. The goal is a single, predictable key order: any template, however it was originally written, ends up in the same shape - so structure is easy to scan, diffs stay meaningful, and the output is identical every time it runs.

The default is deliberately simple: object keys are sorted alphabetically, recursively, all the way down. Most of a template reads perfectly well this way, and a deterministic alphabetical sort is the baseline everything else builds on.

This ordering must be **case-insensitive** and applies everywhere a rule below says "alphabetically": capitalization must not affect placement, so `AWS::SecretsManager::Secret` sorts before `AWS::SQS::Queue`, not after. Keys differing only in case (`Type` vs `type`) must still order deterministically, and the comparison must stay locale-independent so `--check` is reproducible on every machine.

The rules that follow are the intentional exceptions to that baseline. CloudFormation itself ignores key order - templates are parsed as JSON, where key order carries no meaning - so these rules exist for human readability, not correctness. Certain parts of a template have an expected reading order that a pure alphabetical sort would scramble: a resource's `Type` before its `Properties`, the top-level sections in their familiar sequence, and similar. Alphabetizing those is technically valid but reads as wrong to anyone familiar with CloudFormation.

The ordering comes from two places. The top-level section order follows the sequence AWS publishes in its template anatomy documentation. The remaining orderings - resource attributes, parameter and output fields, tag and dependency lists - follow established community convention for the cases AWS does not formally specify; where a convention is firm it is treated as fixed, and where it is merely sensible it is called out as an adjustable default.

Together these rules preserve the predictability of alphabetical sorting while respecting the small, well-known set of places where CloudFormation templates have a conventional shape.

## Rule 1: Top-level section order - order of the root template sections

The root object of a CloudFormation template must not be sorted alphabetically. Its top-level keys follow the AWS-documented section order:

`AWSTemplateFormatVersion`, `Description`, `Metadata`, `Parameters`, `Rules`, `Mappings`, `Conditions`, `Transform`, `Resources`, `Outputs`.

Requirements:

- Define this section order programmatically as a single named list/constant in the source, so it lives in one place and is easy to read and amend later.
- The fixed order applies only to the keys of the root object. Every nested level keeps the existing alphabetical recursive sorting unchanged.
- Only sections actually present are emitted - never insert missing or empty sections.
- Any top-level key not in the defined list must be preserved (never dropped) and placed after all recognized sections, sorted alphabetically among themselves.
- Hang this off the existing comparator seam: the root level resolves order via the defined section list (with the alphabetical fallback for unrecognized keys), while all deeper objects continue to use the plain alphabetical comparator.

## Rule 2: Resource attribute order - key order inside each resource definition

Within each resource definition, keys follow a defined conventional resource-attribute order, then any remaining keys alphabetically - not fully alphabetical.

Order: `Type`, `Condition`, `DependsOn`, `Properties`, `CreationPolicy`, `UpdatePolicy`, `UpdateReplacePolicy`, `DeletionPolicy`, `Metadata`.

Requirements:

- Define this resource-attribute order programmatically as a single named list/constant in the source, the same way the top-level section order is defined. Note in a brief comment that only `Type` and `Properties` reflect a firm convention; the resource attributes (`Condition`, `DependsOn`, the policies, `Metadata`) have no AWS-blessed order, so this constant is the single place to adjust them.
- This rule applies only to resource definition objects - that is, the direct child values of the root `Resources` section (the per-logical-ID resources). It must not apply anywhere else.
- Scope this strictly by structural position, not by key presence. An object deeper in the tree that merely happens to contain a `Type`, `Properties`, or other matching key must be left to the normal alphabetical sorting - for example a `Type` property inside a resource's `Properties` (such as an SSM Parameter's `Type`, or a Route 53 record set's `Type`) must never be hoisted.
- Any key present on a resource that is not in the defined list must be preserved and placed after the defined keys, sorted alphabetically among themselves. Nothing is ever dropped.
- Everything nested inside `Properties` (and any other resource attribute) continues to use the existing alphabetical recursive sorting.
- This is a position-aware rule, so the sorter must be able to recognize when it is ordering the keys of a direct child of the root `Resources` object - extend the recursion to carry enough context (path or parent awareness) to do this, reusing the same comparator seam established for Rule 1.

## Rule 3: Resource grouping by Type - order of the resource entries themselves, clustered by Type

Within the `Resources` section, the resources themselves are not ordered alphabetically by logical ID. They are grouped by their `Type` value, and ordered alphabetically by logical ID within each group.

Requirements:

- This rule applies only to the entries of the root `Resources` object - i.e. the ordering of the per-logical-ID resource definitions among themselves. It does not apply to any other section or to nested objects.
- Primary sort key: the string value of each resource's own `Type` attribute. Secondary sort key: the logical ID (the resource's key). Use the same deterministic, locale-independent comparison used elsewhere for both keys, so `--check` stays reproducible across machines.
- This is the first rule that orders entries by a nested value rather than by key name - the sorter must read each child's `Type` to decide sibling order, which is a new capability distinct from key-name sorting.
- Be robust: a resource with a missing or non-string `Type` must never cause an error and must never be dropped. Order such a resource deterministically by treating its type as an empty string, still breaking ties by logical ID.
- This rule only reorders which resource entries come first. It does not change the key ordering inside any individual resource - Rule 2 (Type/Properties first) and the alphabetical recursive sorting of each resource's contents still apply unchanged.
- It is position-aware in the same way as Rule 2: the sorter must recognize when it is ordering the direct children of the root `Resources` object, reusing the path/parent context already threaded through the recursion.

## Rule 4: Parameter field order - key order inside each parameter definition

Within each parameter definition, keys follow a defined conventional order - `Type` first, then the rest - not full alphabetical.

Suggested order: `Type`, `Description`, `Default`, `AllowedValues`, `AllowedPattern`, `ConstraintDescription`, `MinLength`, `MaxLength`, `MinValue`, `MaxValue`, `NoEcho`.

Requirements:

- Define this parameter-entry order programmatically as a single named list/constant in the source, the same way the other ordered sections are defined. Note in a brief comment that, unlike the top-level section order, there is no AWS-blessed parameter field order - `Type` first is the only near-universal convention, and this constant is the single place to amend the rest.
- This rule applies only to parameter definition objects - the direct child values of the root `Parameters` section (the per-name parameters). It must not apply anywhere else.
- Scope strictly by structural position, not by key presence. An object deeper in the tree that merely contains a `Type` or `Default` key must be left to the normal alphabetical sorting - for example a resource's `Properties.Type` (such as an SSM Parameter resource) must never be reordered by this rule. Only direct children of the root `Parameters` object are affected.
- Any key present on a parameter that is not in the defined list must be preserved and placed after the defined keys, sorted alphabetically among themselves. Nothing is ever dropped.
- Nested contents (e.g. the `AllowedValues` array) keep their existing handling - arrays preserve order, nested objects sort alphabetically.
- This is a position-aware rule like Rules 2 and 3: the sorter must recognize when it is ordering the keys of a direct child of the root `Parameters` object, reusing the path/parent context already threaded through the recursion.

## Rule 5: Output field order - key order inside each output definition

Within each output definition, keys are ordered `Description`, `Value`, `Export`, then any remaining keys alphabetically - not fully alphabetical.

Requirements:

- Define this output-entry order programmatically as a single named list/constant in the source, the same way the top-level section order and resource-attribute order are defined.
- This rule applies only to output definition objects - the direct child values of the root `Outputs` section (the per-name outputs). It must not apply anywhere else.
- Scope this strictly by structural position, not by key presence. An object deeper in the tree that merely happens to contain a `Value`, `Description`, or `Export` key must be left to the normal alphabetical sorting - only the direct children of the root `Outputs` object are affected.
- Any key present on an output that is not in the defined list must be preserved and placed after the defined keys, sorted alphabetically among themselves. Nothing is ever dropped. (Note: `Condition`, a valid but optional output field, falls into this alphabetical tail.)
- Everything nested inside `Value`, `Export`, or any other output key continues to use the existing alphabetical recursive sorting (e.g. `Export` keeps sorting its own contents normally).
- This is a position-aware rule like Rules 2, 3, and 4: the sorter must recognize when it is ordering the keys of a direct child of the root `Outputs` object, reusing the path/parent context already threaded through the recursion.

## Rule 6: Tags array order (by Key) - element order within Tags arrays

A `Tags` array is reordered so its entries are sorted by their `Key` value. This is a deliberate, narrow exception to the baseline rule that array element order is always preserved.

Requirements:

- This rule applies only to the array that is the value of a `Tags` key sitting as a direct child of a resource's `Properties` object - that is, `Resources.<logicalID>.Properties.Tags`. A `Tags` key in any other position is left to the normal handling and never reordered: nested deeper inside `Properties` (e.g. a `TagSpecifications[].Tags`), or appearing under `Metadata`, `Parameters`, `Outputs`, or at the top level.
- It is position-aware like Rules 2–5: the sorter must recognize when a `Tags` array sits directly under a resource's `Properties`, reusing the path/parent context already threaded through the recursion.
- Apply this only when the array is safely recognizable as a tag list - every element is an object with a string `Key`. If any element does not fit that shape (not an object, or missing/non-string `Key`), leave the entire array's order untouched and fall back to the normal array handling. Never drop or alter elements; this rule only changes their order.
- Sort the array's elements by the string value of each element's `Key`, using the same deterministic, locale-independent comparison used everywhere else. The sort must be stable, so entries with equal `Key` keep their original relative order.
- After ordering the elements, each element's own keys continue to sort with the existing alphabetical recursive sorting (e.g. `Key`, `Value` within each tag).
- If a `Tags` value is not an array (e.g. an object/map), this rule does not apply and the value is handled by the normal sorting.
- This is one of only two places array order is changed (alongside `DependsOn`, Rule 7); the global "never reorder arrays" behavior remains in force everywhere else. Implement it as an explicit, clearly-named special case so that exception is obvious to a future reader.

## Rule 7: DependsOn array order - element order within DependsOn arrays

When a `DependsOn` value is an array of logical IDs, its entries are sorted alphabetically. This is a deliberate, narrow exception to the baseline rule that array element order is preserved - the second such exception, alongside Tags.

Requirements:

- This rule applies only to the `DependsOn` value of a resource definition - the `DependsOn` attribute that is a direct child of a resource (a direct child of the root `Resources` object). `DependsOn` only ever appears in this position in CloudFormation, so scope it there and nowhere else. `DependsOn` order is insignificant in CloudFormation, so sorting it is safe.
- It is position-aware like Rules 2–6: the sorter must recognize when a `DependsOn` value sits directly on a resource definition, reusing the path/parent context already threaded through the recursion.
- Sort the array's string elements alphabetically using the same deterministic, locale-independent comparison used everywhere else. The sort must be stable.
- Apply this only when the value is safely recognizable - an array whose elements are all strings. If `DependsOn` is a single string (also valid), there is nothing to sort. If the value is an array containing any non-string element, leave its order untouched and fall back to the normal array handling. Never drop or alter elements; this rule only changes their order.
- Like Tags, this is scoped by structural position, and is one of only two places array order is changed. The global "never reorder arrays" behavior remains in force everywhere else.
- Implement it as an explicit, clearly-named special case, consistent with the Tags exception, so the carve-out is obvious to a future reader.

## Rule 8: Policy field order - key order inside policy documents and their statements

Within an IAM-style policy document, the keys of the document and of each statement follow a defined conventional order - not alphabetical. Policy documents are located by an explicit, curated list of concrete paths, not by shape and not by a recursive search for a key name.

Document key order: `Version`, `Id`, `Statement`.

Statement key order: `Sid`, `Effect`, `Principal`, `NotPrincipal`, `Action`, `NotAction`, `Resource`, `NotResource`, `Condition`.

Requirements:

- Define three things programmatically as named constants in the source: the document key order, the statement key order, and the list of concrete policy-document paths. Keep the path list in one place so it is easy to read and extend; note in a brief comment that it is a deliberately curated set of safe bets, not an exhaustive catalogue.
- The rule applies only at these exact paths, each rooted at a resource's `Properties` (i.e. under `Resources.<logicalID>.Properties`):
  - `PolicyDocument` - covers `AWS::IAM::Policy`, `AWS::IAM::ManagedPolicy`, `AWS::IAM::RolePolicy` / `UserPolicy` / `GroupPolicy`, `AWS::S3::BucketPolicy`, `AWS::SQS::QueuePolicy`, `AWS::SNS::TopicPolicy`, `AWS::Logs::ResourcePolicy`, and the like.
  - `AssumeRolePolicyDocument` - the `AWS::IAM::Role` trust policy.
  - `KeyPolicy` - the `AWS::KMS::Key` (and `AWS::KMS::ReplicaKey`) policy.
  - `RepositoryPolicyText` - the `AWS::ECR::Repository` policy.
  - `Policies[*].PolicyDocument` - inline policies on `AWS::IAM::Role` / `AWS::IAM::User` / `AWS::IAM::Group` (the `PolicyDocument` of every element of the `Policies` array).
- These names are reserved by CloudFormation/IAM convention to hold a policy-document object at these paths, so the path is the binding - no resource `Type` check is needed or performed, consistent with every other rule keying off structural position rather than `Type`.
- It is position-aware like Rules 2–7, and path matching is exact - never a recursive subtree walk. A matching key name found anywhere other than these listed paths (deeper inside another property, or under `Metadata`, `Parameters`, `Outputs`, or top level) is left to the normal handling and never reordered. The path grammar supports a fixed `[*]` array segment meaning "every element" (as in `Policies[*].PolicyDocument`); it supports no open-ended wildcards.
- Order the policy document's own keys as `Version`, `Id`, `Statement`, then any remaining keys alphabetically.
- `Statement` may be a single statement object or an array of statement objects (both valid). Order the keys of each statement object using the statement key order, then any remaining keys alphabetically. Do not reorder the entries of the `Statement` array itself - element order is preserved, consistent with the baseline; only the keys within each statement are ordered.
- Any key on a statement or on the document that is not in the defined list must be preserved and placed after the defined keys, sorted alphabetically among themselves. Nothing is ever dropped.
- Be robust: at any bound path, do nothing and fall back to the normal handling - never error, never drop - when the value is not a plain object (e.g. `RepositoryPolicyText`, or `AWS::Logs::ResourcePolicy`'s `PolicyDocument`, supplied as a JSON string), when the value is an intrinsic-function object (a single `Fn::*` or `Ref` key, such as `Fn::Sub` / `Fn::If`) rather than a literal document, when `Statement` is absent, or when a statement entry is not an object. This guard is what keeps the path-only binding safe.
- Everything nested inside a statement (e.g. the `Condition` block, `Principal` maps, `Action` / `Resource` arrays) continues to use the existing handling - arrays preserve order, nested objects sort alphabetically.
- Reserved policy names that are ambiguous across services (e.g. `ResourcePolicy`) are deliberately left out as not a safe bet; the path list is the single place to add more once their shape and position are certain.
