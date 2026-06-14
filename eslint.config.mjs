import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import perfectionist from 'eslint-plugin-perfectionist';
import unicorn from 'eslint-plugin-unicorn';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import path from 'node:path';
import tseslint from 'typescript-eslint';

export default defineConfig([
  includeIgnoreFile(path.join(import.meta.dirname, '.gitignore')),
  js.configs.recommended,
  {
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-member-accessibility': ['error', { overrides: { constructors: 'no-public' } }],
    },
  },
  perfectionist.configs['recommended-natural'],
  stylistic.configs.customize({ braceStyle: '1tbs', semi: true }),
  unicorn.configs.recommended,
  {
    rules: {
      '@stylistic/max-len': ['error', { code: 120, ignoreUrls: true }],
      'unicorn/filename-case': ['error', { cases: { camelCase: true, pascalCase: true } }],
      'unicorn/no-null': 'off',
    },
  },
]);
