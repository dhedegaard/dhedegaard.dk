import { defineConfig, globalIgnores } from 'eslint/config'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import unicorn from 'eslint-plugin-unicorn'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default defineConfig([
  globalIgnores(['**/node_modules', '**/.next', '**/public', 'src/codegen']),
  {
    extends: compat.extends(
      'next/core-web-vitals',
      'next/typescript',
      'plugin:@typescript-eslint/strict-type-checked',
      'plugin:unicorn/recommended'
    ),

    plugins: {
      '@typescript-eslint': typescriptEslint,
      unicorn,
    },

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 5,
      sourceType: 'script',

      parserOptions: {
        project: true,
      },
    },

    rules: {
      'no-console': [
        'error',
        {
          allow: ['warn', 'error'],
        },
      ],

      eqeqeq: ['error', 'smart'],

      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],

      '@typescript-eslint/strict-boolean-expressions': 'error',
      'prefer-const': 'error',

      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowBoolean: true,
          allowNumber: true,
          allowNullish: true,
        },
      ],

      '@typescript-eslint/no-empty-object-type': 'off',
      'unicorn/no-null': 'off',

      'unicorn/prevent-abbreviations': [
        'error',
        {
          allowList: {
            props: true,
            Props: true,
          },
        },
      ],
    },
  },
])
