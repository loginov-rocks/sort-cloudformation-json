#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

import { sortValue } from "./sort.ts";

async function main(): Promise<void> {
  const path = process.argv[2];
  if (path === undefined) {
    console.error("Usage: sort-cloudformation-json <path-to-json>");
    process.exitCode = 1;
    return;
  }

  const original = await readFile(path, "utf8");
  const sorted = sortValue(JSON.parse(original));

  // Match the original file's trailing newline (present or absent).
  const trailingNewline = original.endsWith("\n") ? "\n" : "";
  await writeFile(path, JSON.stringify(sorted, null, 2) + trailingNewline);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
