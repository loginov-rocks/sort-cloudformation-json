import { readFile, writeFile } from 'node:fs/promises';

import { sortValue } from './sort.ts';
import { resolveTemplateComparator } from './templateOrder.ts';

/**
 * Reads a JSON file, sorts its keys with {@link sortValue}, and writes it back
 * in place using 2-space indentation. The original file's trailing newline is
 * preserved (kept if present, omitted if absent).
 */
export async function formatFile(filePath: string): Promise<void> {
  const original = await readFile(filePath, 'utf8');
  // Position-aware ordering: fixed section order at the root, fixed attribute
  // order within each resource, alphabetical everywhere else.
  const sorted = sortValue(JSON.parse(original), resolveTemplateComparator);

  const trailingNewline = original.endsWith('\n') ? '\n' : '';
  await writeFile(filePath, JSON.stringify(sorted, null, 2) + trailingNewline);
}
