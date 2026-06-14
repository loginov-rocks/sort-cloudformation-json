import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { formatFile } from "./format.ts";

describe("formatFile", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "sort-cfn-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  async function write(name: string, contents: string): Promise<string> {
    const filePath = join(dir, name);
    await writeFile(filePath, contents);
    return filePath;
  }

  it("rewrites the file with sorted keys and 2-space indentation", async () => {
    const filePath = await write(
      "template.json",
      JSON.stringify({
        Resources: { Bucket: { Type: "AWS::S3::Bucket", DeletionPolicy: "Retain" } },
        AWSTemplateFormatVersion: "2010-09-09",
      }),
    );

    await formatFile(filePath);

    expect(await readFile(filePath, "utf8")).toBe(
      [
        "{",
        '  "AWSTemplateFormatVersion": "2010-09-09",',
        '  "Resources": {',
        '    "Bucket": {',
        '      "DeletionPolicy": "Retain",',
        '      "Type": "AWS::S3::Bucket"',
        "    }",
        "  }",
        "}",
      ].join("\n"),
    );
  });

  it("preserves a trailing newline when the original had one", async () => {
    const filePath = await write("with-newline.json", '{"b":1,"a":2}\n');

    await formatFile(filePath);

    expect(await readFile(filePath, "utf8")).toBe('{\n  "a": 2,\n  "b": 1\n}\n');
  });

  it("does not add a trailing newline when the original had none", async () => {
    const filePath = await write("no-newline.json", '{"b":1,"a":2}');

    const result = await formatFile(filePath).then(() => readFile(filePath, "utf8"));

    expect(result.endsWith("}")).toBe(true);
    expect(result.endsWith("\n")).toBe(false);
  });

  it("preserves array order while sorting keys throughout a CloudFormation template", async () => {
    const filePath = await write(
      "policy.json",
      JSON.stringify({
        Resources: {
          Policy: {
            Type: "AWS::IAM::Policy",
            Properties: {
              PolicyDocument: {
                Version: "2012-10-17",
                Statement: [
                  { Sid: "Second", Effect: "Allow", Action: ["s3:GetObject", "s3:PutObject"] },
                  { Sid: "First", Effect: "Deny", Action: "s3:DeleteObject" },
                ],
              },
            },
          },
        },
      }),
    );

    await formatFile(filePath);
    const result = JSON.parse(await readFile(filePath, "utf8")) as {
      Resources: {
        Policy: { Properties: { PolicyDocument: { Statement: { Sid: string }[] } } };
      };
    };

    const statements = result.Resources.Policy.Properties.PolicyDocument.Statement;
    // Array order is meaningful and must be preserved.
    expect(statements.map((statement) => statement.Sid)).toEqual(["Second", "First"]);
    // Action arrays must keep their order too.
    expect(await readFile(filePath, "utf8")).toContain('"s3:GetObject",\n');
  });

  it("orders the root by CloudFormation section order while sorting nested keys alphabetically", async () => {
    const filePath = await write(
      "ordered.json",
      JSON.stringify({
        Outputs: { BucketArn: { Value: "arn" } },
        CustomTooling: { note: "vendor extension" },
        Resources: { Bucket: { Type: "AWS::S3::Bucket", DeletionPolicy: "Retain" } },
        Description: "Example stack",
        Parameters: { EnvName: { Type: "String", Default: "dev" } },
        AWSTemplateFormatVersion: "2010-09-09",
      }),
    );

    await formatFile(filePath);
    const result = JSON.parse(await readFile(filePath, "utf8")) as Record<string, unknown>;

    // Root keys follow the documented section order; the unknown "CustomTooling"
    // key is preserved and placed last.
    expect(Object.keys(result)).toEqual([
      "AWSTemplateFormatVersion",
      "Description",
      "Parameters",
      "Resources",
      "Outputs",
      "CustomTooling",
    ]);

    // Nested objects remain alphabetical.
    expect(Object.keys(result.Resources as Record<string, unknown>)).toEqual(["Bucket"]);
    const bucket = (result.Resources as { Bucket: Record<string, unknown> }).Bucket;
    expect(Object.keys(bucket)).toEqual(["DeletionPolicy", "Type"]);
    expect(Object.keys((result.Parameters as { EnvName: object }).EnvName)).toEqual([
      "Default",
      "Type",
    ]);
  });

  it("rejects when the file does not contain valid JSON", async () => {
    const filePath = await write("broken.json", "{ not json");

    await expect(formatFile(filePath)).rejects.toThrow();
  });
});
