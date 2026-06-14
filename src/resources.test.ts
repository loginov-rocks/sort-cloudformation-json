import { describe, expect, it } from "@jest/globals";

import { compareResourceAttributes, RESOURCE_ATTRIBUTE_ORDER } from "./resources.ts";

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
