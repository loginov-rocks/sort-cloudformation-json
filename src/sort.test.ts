import { describe, expect, it } from "@jest/globals";

import { compareKeys } from "./compare.ts";
import { sortValue } from "./sort.ts";

describe("sortValue", () => {
  it("returns primitives unchanged", () => {
    expect(sortValue("AWS::S3::Bucket")).toBe("AWS::S3::Bucket");
    expect(sortValue(42)).toBe(42);
    expect(sortValue(true)).toBe(true);
    expect(sortValue(null)).toBeNull();
  });

  it("sorts the keys of a flat object", () => {
    const sorted = sortValue({ Type: "AWS::S3::Bucket", DeletionPolicy: "Retain" });

    expect(Object.keys(sorted as object)).toEqual(["DeletionPolicy", "Type"]);
  });

  it("sorts keys recursively in nested objects", () => {
    const template = {
      Resources: {
        Queue: {
          Type: "AWS::SQS::Queue",
          Properties: { VisibilityTimeout: 30, QueueName: "jobs" },
        },
      },
      AWSTemplateFormatVersion: "2010-09-09",
    };

    expect(sortValue(template)).toEqual({
      AWSTemplateFormatVersion: "2010-09-09",
      Resources: {
        Queue: {
          Properties: { QueueName: "jobs", VisibilityTimeout: 30 },
          Type: "AWS::SQS::Queue",
        },
      },
    });
  });

  it("preserves array element order while sorting keys of nested objects", () => {
    const value = {
      Tags: [
        { Value: "prod", Key: "env" },
        { Value: "team-a", Key: "owner" },
      ],
    };

    const sorted = sortValue(value) as { Tags: Record<string, string>[] };

    // Element order is unchanged...
    expect(sorted.Tags.map((tag) => tag.Key)).toEqual(["env", "owner"]);
    // ...but each element's keys are sorted.
    expect(sorted.Tags.map((tag) => Object.keys(tag))).toEqual([
      ["Key", "Value"],
      ["Key", "Value"],
    ]);
  });

  it("recurses into arrays holding mixed objects and primitives", () => {
    const value = {
      Statement: [{ Sid: "Allow", Effect: "Allow", Action: "s3:*" }, "*", 1, null],
    };

    expect(sortValue(value)).toEqual({
      Statement: [{ Action: "s3:*", Effect: "Allow", Sid: "Allow" }, "*", 1, null],
    });
  });

  it("consults the resolver per object using its path, defaulting deeper levels", () => {
    const reverse = (a: string, b: string): number => (a < b ? 1 : a > b ? -1 : 0);
    // Reverse only the root object's keys; everything deeper stays alphabetical.
    const resolve = (path: readonly string[]) => (path.length === 0 ? reverse : compareKeys);

    const sorted = sortValue(
      { a: 1, b: 2, nested: { y: 1, x: 2 } },
      resolve,
    ) as Record<string, unknown>;

    expect(Object.keys(sorted)).toEqual(["nested", "b", "a"]);
    expect(Object.keys(sorted.nested as object)).toEqual(["x", "y"]);
  });

  it("treats arrays as transparent to the path (indices are not path segments)", () => {
    const seen: string[][] = [];
    const resolve = (path: readonly string[]) => {
      seen.push([...path]);
      return compareKeys;
    };

    sortValue({ list: [{ b: 1 }, { a: 2 }] }, resolve);

    // The objects inside the array are both reached at path ["list"], not
    // ["list", 0] / ["list", 1].
    expect(seen).toContainEqual(["list"]);
    expect(seen).toEqual([[], ["list"], ["list"]]);
  });

  it("does not mutate the input value", () => {
    const template = { B: 1, A: 2 };

    sortValue(template);

    expect(Object.keys(template)).toEqual(["B", "A"]);
  });
});
