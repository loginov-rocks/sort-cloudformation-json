import { formatFile } from "./format.ts";

/**
 * CLI control flow: validate the argument, format the file, and translate the
 * outcome into a process exit code (0 on success, 1 on any failure).
 */
export async function run(args: readonly string[]): Promise<number> {
  const filePath = args[0];
  if (filePath === undefined) {
    console.error("Usage: sort-cloudformation-json <path-to-json>");
    return 1;
  }

  try {
    await formatFile(filePath);
    return 0;
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : error);
    return 1;
  }
}
