import { describe, expect, it } from "@jest/globals";

import { compareKeys } from "./compare.ts";

describe("compareKeys", () => {
  it("returns -1 when the first key sorts before the second", () => {
    expect(compareKeys("a", "b")).toBe(-1);
  });

  it("returns 1 when the first key sorts after the second", () => {
    expect(compareKeys("b", "a")).toBe(1);
  });

  it("returns 0 for equal keys", () => {
    expect(compareKeys("Resources", "Resources")).toBe(0);
  });

  it("orders by UTF-16 code unit, so uppercase sorts before lowercase", () => {
    expect(compareKeys("Bucket", "access")).toBe(-1);
  });

  it("produces a stable, locale-independent ordering when used with sort()", () => {
    const keys = ["Outputs", "Resources", "Parameters", "AWSTemplateFormatVersion"];

    expect([...keys].sort(compareKeys)).toEqual([
      "AWSTemplateFormatVersion",
      "Outputs",
      "Parameters",
      "Resources",
    ]);
  });
});
