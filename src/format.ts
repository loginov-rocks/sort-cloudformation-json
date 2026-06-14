import { readFile, writeFile } from "node:fs/promises";

import { compareTopLevelSections } from "./sections.ts";
import { sortValue } from "./sort.ts";

/**
 * Reads a JSON file, sorts its keys with {@link sortValue}, and writes it back
 * in place using 2-space indentation. The original file's trailing newline is
 * preserved (kept if present, omitted if absent).
 */
export async function formatFile(filePath: string): Promise<void> {
  const original = await readFile(filePath, "utf8");
  // The root object follows the fixed CloudFormation section order; everything
  // nested below it is sorted alphabetically.
  const sorted = sortValue(JSON.parse(original), compareTopLevelSections);

  const trailingNewline = original.endsWith("\n") ? "\n" : "";
  await writeFile(filePath, JSON.stringify(sorted, null, 2) + trailingNewline);
}
