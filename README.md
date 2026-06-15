# sort-cloudformation-json

Inspired by https://github.com/keithamus/sort-package-json and https://github.com/azat-io/eslint-plugin-perfectionist

Zero-config CLI that sorts the keys of a CloudFormation JSON template
alphabetically and recursively, rewriting the file in place.

- Recursively sorts every object's keys with a deterministic, locale-independent
  ordering (reproducible across machines).
- Never reorders array elements — order is meaningful in CloudFormation — but
  still sorts the keys of any objects nested inside arrays.
- Preserves the file's trailing newline and uses 2-space indentation.

## Usage

Run directly with `npx`:

```sh
npx sort-cloudformation-json ./aws/infrastructure.json
```

Or wire it into a `package.json` script:

```json
{
  "scripts": {
    "infrastructure:format": "sort-cloudformation-json ./aws/infrastructure.json"
  }
}
```

It takes a single argument: the path to the JSON file to sort in place.

## Requirements

- Node.js 24+.

## Development

The source lives in `src/` and uses only erasable TypeScript syntax, so it runs
directly on Node 24 via native type stripping — no loader required:

```sh
node src/cli.ts ./aws/infrastructure.json
```

```sh
npm run build   # compile to dist/ (JavaScript + type declarations) with tsc
npm run lint    # ESLint
```

## AI

Written mostly by Claude Opus 4.8 at High effort.
