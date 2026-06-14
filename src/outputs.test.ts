import { describe, expect, it } from "@jest/globals";

import { compareOutputEntry, OUTPUT_ENTRY_ORDER } from "./outputs.ts";

describe("compareOutputEntry", () => {
  it("orders Description, then Value, then Export", () => {
    expect(compareOutputEntry("Description", "Value")).toBeLessThan(0);
    expect(compareOutputEntry("Value", "Export")).toBeLessThan(0);
    expect(compareOutputEntry("Export", "Description")).toBeGreaterThan(0);
  });

  it("places recognized keys before any other key", () => {
    expect(compareOutputEntry("Export", "Condition")).toBeLessThan(0);
    expect(compareOutputEntry("Anything", "Value")).toBeGreaterThan(0);
  });

  it("sorts remaining keys alphabetically among themselves", () => {
    expect(compareOutputEntry("Alpha", "Beta")).toBeLessThan(0);
    expect(compareOutputEntry("Zebra", "Alpha")).toBeGreaterThan(0);
  });

  it("sorts a shuffled output entry into the expected order", () => {
    const keys = ["Export", "Condition", "Value", "Description", "AnExtra"];

    expect([...keys].sort(compareOutputEntry)).toEqual([
      "Description",
      "Value",
      "Export",
      "AnExtra",
      "Condition",
    ]);
  });

  it("exposes the output entry order in one place", () => {
    expect(OUTPUT_ENTRY_ORDER).toEqual(["Description", "Value", "Export"]);
  });
});
