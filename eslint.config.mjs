// ESLint flat config (ADR-0008). Bug-catching rules only: Prettier owns
// formatting, and lit-analyzer type-checks the templates.
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import lit from 'eslint-plugin-lit';
import wc from 'eslint-plugin-wc';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import vue from 'eslint-plugin-vue';

export default defineConfig(
  globalIgnores([
    // Agent worktrees are whole copies of the repo.
    '.claude/',
    '**/.vitest/',
    '**/dist/',
    '**/cdn/',
    '**/custom-elements.json',
    '**/test-results/',
    '**/playwright-report/',
    '**/coverage/',
    '**/storybook-static/',
  ]),

  js.configs.recommended,
  tseslint.configs.strict,

  // Node: build scripts, servers, tool configs, and Playwright specs.
  {
    files: ['**/*.{js,mjs,cjs}', '**/*.config.ts', 'apps/*/tests/**'],
    languageOptions: { globals: globals.node },
  },

  // Browser code.
  {
    files: ['packages/components/src/**', 'apps/*/src/**'],
    languageOptions: { globals: globals.browser },
  },

  // Vue single-file components (apps/shopping-list): the error-prevention
  // set only, since Prettier owns formatting. vue-eslint-parser
  // reads the template; <script lang="ts"> goes to the TypeScript parser.
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },

  // Lit and Web Component rules for the components themselves.
  {
    files: ['packages/components/src/**/*.ts'],
    extends: [lit.configs['flat/recommended'], wc.configs['flat/best-practice']],
    settings: { wc: { elementBaseClasses: ['LitElement'] } },
  },
);
