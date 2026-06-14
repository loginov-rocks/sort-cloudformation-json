import { describe, expect, it } from "@jest/globals";

import { isTagList, sortTagsByKey } from "./tags.ts";

describe("isTagList", () => {
  it("is true for the Tags key when every element is an object with a string Key", () => {
    expect(isTagList("Tags", [{ Key: "env", Value: "prod" }, { Key: "team" }])).toBe(true);
  });

  it("is true for an empty Tags array", () => {
    expect(isTagList("Tags", [])).toBe(true);
  });

  it("is false when the key is not exactly 'Tags'", () => {
    expect(isTagList("NotTags", [{ Key: "env" }])).toBe(false);
    expect(isTagList(undefined, [{ Key: "env" }])).toBe(false);
  });

  it("is false when any element is not tag-shaped", () => {
    expect(isTagList("Tags", [{ Key: "env" }, "oops"])).toBe(false); // not an object
    expect(isTagList("Tags", [{ Key: "env" }, null])).toBe(false); // null
    expect(isTagList("Tags", [{ Value: "x" }])).toBe(false); // missing Key
    expect(isTagList("Tags", [{ Key: 42 }])).toBe(false); // non-string Key
  });
});

describe("sortTagsByKey", () => {
  it("orders tags by their Key deterministically", () => {
    const tags = [
      { Key: "owner", Value: "team-a" },
      { Key: "env", Value: "prod" },
      { Key: "App", Value: "web" },
    ];

    expect(sortTagsByKey(tags)).toEqual([
      { Key: "App", Value: "web" }, // uppercase sorts before lowercase
      { Key: "env", Value: "prod" },
      { Key: "owner", Value: "team-a" },
    ]);
  });

  it("is stable: equal Keys keep their original relative order", () => {
    const tags = [
      { Key: "env", Value: "first" },
      { Key: "env", Value: "second" },
      { Key: "env", Value: "third" },
    ];

    expect(sortTagsByKey(tags)).toEqual(tags);
  });

  it("does not mutate the input array", () => {
    const tags = [{ Key: "b" }, { Key: "a" }];
    sortTagsByKey(tags);
    expect(tags.map((tag) => tag.Key)).toEqual(["b", "a"]);
  });
});
