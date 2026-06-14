import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("./format.ts");

import { formatFile } from "./format.ts";
import { run } from "./run.ts";

const mockedFormatFile = jest.mocked(formatFile);

describe("run", () => {
  let errorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    mockedFormatFile.mockReset();
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("prints usage and returns 1 when no file path is given", async () => {
    expect(await run([])).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(
      "Usage: sort-cloudformation-json <path-to-json>",
    );
    expect(mockedFormatFile).not.toHaveBeenCalled();
  });

  it("formats the given file and returns 0 on success", async () => {
    mockedFormatFile.mockResolvedValue(undefined);

    expect(await run(["./aws/infrastructure.json"])).toBe(0);
    expect(mockedFormatFile).toHaveBeenCalledWith("./aws/infrastructure.json");
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("prints the message and returns 1 when formatting throws an Error", async () => {
    mockedFormatFile.mockRejectedValue(new Error("ENOENT: missing.json"));

    expect(await run(["missing.json"])).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith("ENOENT: missing.json");
  });

  it("prints a non-Error rejection value as-is and returns 1", async () => {
    mockedFormatFile.mockRejectedValue("boom");

    expect(await run(["weird.json"])).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith("boom");
  });
});
