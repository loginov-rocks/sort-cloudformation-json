import { describe, expect, it } from "@jest/globals";

import {
  compareResourceAttributes,
  compareResourcesByType,
  RESOURCE_ATTRIBUTE_ORDER,
} from "./resources.ts";

describe("compareResourceAttributes", () => {
  it("orders Type before Properties", () => {
    expect(compareResourceAttributes("Type", "Properties")).toBeLessThan(0);
    expect(compareResourceAttributes("Properties", "Type")).toBeGreaterThan(0);
  });

  it("places recognized attributes before any other key", () => {
    expect(compareResourceAttributes("Properties", "DependsOn")).toBeLessThan(0);
    expect(compareResourceAttributes("Condition", "Type")).toBeGreaterThan(0);
  });

  it("sorts remaining attributes alphabetically among themselves", () => {
    expect(compareResourceAttributes("Condition", "DeletionPolicy")).toBeLessThan(0);
    expect(compareResourceAttributes("Metadata", "DependsOn")).toBeGreaterThan(0);
  });

  it("sorts a shuffled resource attribute set into the expected order", () => {
    const keys = ["DeletionPolicy", "Properties", "Metadata", "Type", "Condition", "DependsOn"];

    expect([...keys].sort(compareResourceAttributes)).toEqual([
      "Type",
      "Properties",
      "Condition",
      "DeletionPolicy",
      "DependsOn",
      "Metadata",
    ]);
  });

  it("exposes the attribute order in one place", () => {
    expect(RESOURCE_ATTRIBUTE_ORDER).toEqual(["Type", "Properties"]);
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
