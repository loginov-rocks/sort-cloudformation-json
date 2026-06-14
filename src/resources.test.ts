import { describe, expect, it } from "@jest/globals";

import {
  compareResourceAttributes,
  compareResourcesByType,
  RESOURCE_ATTRIBUTE_ORDER,
} from "./resources.ts";

describe("compareResourceAttributes", () => {
  it("orders the conventional attributes by their defined position", () => {
    expect(compareResourceAttributes("Type", "Properties")).toBeLessThan(0);
    expect(compareResourceAttributes("Condition", "DependsOn")).toBeLessThan(0);
    expect(compareResourceAttributes("DependsOn", "Properties")).toBeLessThan(0);
    expect(compareResourceAttributes("DeletionPolicy", "Metadata")).toBeLessThan(0);
    expect(compareResourceAttributes("Metadata", "Type")).toBeGreaterThan(0);
  });

  it("places recognized attributes before any unlisted key", () => {
    expect(compareResourceAttributes("Metadata", "CustomKey")).toBeLessThan(0);
    expect(compareResourceAttributes("Anything", "Type")).toBeGreaterThan(0);
  });

  it("sorts unlisted attributes alphabetically among themselves", () => {
    expect(compareResourceAttributes("Apple", "Banana")).toBeLessThan(0);
    expect(compareResourceAttributes("Zebra", "Apple")).toBeGreaterThan(0);
  });

  it("sorts a shuffled resource attribute set into the expected order", () => {
    const keys = [
      "Metadata",
      "Properties",
      "Custom",
      "DeletionPolicy",
      "Type",
      "UpdatePolicy",
      "Condition",
      "UpdateReplacePolicy",
      "DependsOn",
      "CreationPolicy",
    ];

    expect([...keys].sort(compareResourceAttributes)).toEqual([
      "Type",
      "Condition",
      "DependsOn",
      "Properties",
      "CreationPolicy",
      "UpdatePolicy",
      "UpdateReplacePolicy",
      "DeletionPolicy",
      "Metadata",
      "Custom", // unlisted -> after recognized, alphabetical
    ]);
  });

  it("exposes the full attribute order in one place", () => {
    expect(RESOURCE_ATTRIBUTE_ORDER).toEqual([
      "Type",
      "Condition",
      "DependsOn",
      "Properties",
      "CreationPolicy",
      "UpdatePolicy",
      "UpdateReplacePolicy",
      "DeletionPolicy",
      "Metadata",
    ]);
  });
});

describe("compareResourcesByType", () => {
  it("groups logical IDs by their Type, alphabetically by ID within a group", () => {
    const resources = {
      WebQueue: { Type: "AWS::SQS::Queue" },
      AppBucket: { Type: "AWS::S3::Bucket" },
      DataQueue: { Type: "AWS::SQS::Queue" },
      LogsBucket: { Type: "AWS::S3::Bucket" },
    };

    expect(Object.keys(resources).sort(compareResourcesByType(resources))).toEqual([
      // S3 buckets first (Type sorts earlier), each group alphabetical by ID.
      "AppBucket",
      "LogsBucket",
      "DataQueue",
      "WebQueue",
    ]);
  });

  it("breaks ties on identical Type by logical ID", () => {
    const resources = {
      Zebra: { Type: "AWS::S3::Bucket" },
      Apple: { Type: "AWS::S3::Bucket" },
    };

    expect(compareResourcesByType(resources)("Zebra", "Apple")).toBeGreaterThan(0);
  });

  it("treats a missing or non-string Type as an empty string, never throwing or dropping", () => {
    const resources = {
      Typed: { Type: "AWS::S3::Bucket" },
      MissingType: { Properties: {} },
      NonStringType: { Type: 42 },
      NotAnObject: "oops",
      NullResource: null,
    };

    // Empty-string types sort before any real type; ties break by logical ID.
    expect(Object.keys(resources).sort(compareResourcesByType(resources))).toEqual([
      "MissingType",
      "NonStringType",
      "NotAnObject",
      "NullResource",
      "Typed",
    ]);
  });
});
