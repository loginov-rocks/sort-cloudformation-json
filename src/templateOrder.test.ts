import { describe, expect, it } from "@jest/globals";

import { compareResourceAttributes } from "./resources.ts";
import { compareTopLevelSections } from "./sections.ts";
import { resolveTemplateComparator } from "./templateOrder.ts";

describe("resolveTemplateComparator", () => {
  it("uses the section order for the root object", () => {
    expect(resolveTemplateComparator([])).toBe(compareTopLevelSections);
  });

  it("uses the resource attribute order for a direct child of root Resources", () => {
    expect(resolveTemplateComparator(["Resources", "MyBucket"])).toBe(compareResourceAttributes);
  });

  it("does not apply the resource order to the Resources container itself", () => {
    // The Resources object's own keys are logical IDs, sorted alphabetically.
    expect(resolveTemplateComparator(["Resources"])).not.toBe(compareResourceAttributes);
  });

  it("does not apply the resource order below a resource (e.g. inside Properties)", () => {
    // A `Type` key here (SSM parameter, Route 53 record set, ...) must stay
    // alphabetical, never hoisted.
    expect(
      resolveTemplateComparator(["Resources", "MyParam", "Properties"]),
    ).not.toBe(compareResourceAttributes);
  });

  it("does not apply the resource order to a deeper key that merely equals 'Resources'", () => {
    expect(
      resolveTemplateComparator(["Resources", "MyRes", "Properties", "Resources"]),
    ).not.toBe(compareResourceAttributes);
  });
});
