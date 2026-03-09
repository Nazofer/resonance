import { defineConfig } from 'eslint/config';
import eslintPlugin from '@eslint/js';
import { configs as tseslintConfigs } from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import nextPlugin from '@next/eslint-plugin-next';
import stylisticPlugin from '@stylistic/eslint-plugin';
import tailwindcssPlugin from 'eslint-plugin-better-tailwindcss';
import reactCompilerPlugin from 'eslint-plugin-react-compiler';

// Global ignores configuration
// Must be in its own config object to act as global ignores
const ignoresConfig = defineConfig([
  {
    name: 'project/ignores',
    ignores: [
      '.next/',
      'node_modules/',
      'public/',
      '.vscode/',
      'next-env.d.ts',
    ],
  },
]);

// ESLint recommended rules for JavaScript/TypeScript
const eslintConfig = defineConfig([
  {
    name: 'project/javascript-recommended',
    files: ['**/*.{js,mjs,ts,tsx}'],
    ...eslintPlugin.configs.recommended,
  },
]);

// TypeScript configuration with type-checked rules
const typescriptConfig = defineConfig([
  {
    name: 'project/typescript-strict',
    files: ['**/*.{ts,tsx,mjs}'],
    extends: [
      ...tseslintConfigs.strictTypeChecked,
      ...tseslintConfigs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        // Automatically detects tsconfig.json
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
        warnOnUnsupportedTypeScriptVersion: true,
      },
    },
    rules: {
      // Disable rules that conflict with TypeScript's own error checking
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      // disabled next rule due to bug:
      // https://github.com/typescript-eslint/typescript-eslint/issues/11732
      // https://github.com/eslint/eslint/issues/20272
      '@typescript-eslint/unified-signatures': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      // Allow ts-expect-error and ts-ignore with descriptions
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': 'allow-with-description',
          'ts-nocheck': false,
          'ts-check': false,
          'minimumDescriptionLength': 3,
        },
      ],
    },
  },
  {
    name: 'project/javascript-disable-type-check',
    files: ['**/*.{js,mjs,cjs}'],
    ...tseslintConfigs.disableTypeChecked,
  },
]);

// React and Next.js configuration
const reactConfig = defineConfig([
  {
    name: 'project/react-next',
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      '@next/next': nextPlugin,
    },
    rules: {
      // React recommended rules
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      // React Hooks rules (use recommended-latest for latest features)
      ...reactHooksPlugin.configs['recommended-latest'].rules,
      // Accessibility rules (strict mode for better a11y)
      ...jsxA11yPlugin.configs.strict.rules,
      // Next.js recommended rules
      ...nextPlugin.configs.recommended.rules,
      // Next.js Core Web Vitals rules
      ...nextPlugin.configs['core-web-vitals'].rules,

      // Customizations for modern React/Next.js
      'react/react-in-jsx-scope': 'off', // Not needed in Next.js
      'react/prop-types': 'off', // Use TypeScript instead
      'react/no-unknown-property': 'off', // Conflicts with custom attributes
      'react/jsx-no-target-blank': 'off', // Next.js handles this

      // Fine-tuned accessibility rules
      'jsx-a11y/alt-text': [
        'warn',
        {
          elements: ['img'],
          img: ['Image'], // Next.js Image component
        },
      ],
      'jsx-a11y/media-has-caption': 'warn',
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',
    },
    settings: {
      react: {
        version: 'detect', // Automatically detect React version
      },
    },
  },
]);

// Code style and formatting configuration
const stylisticConfig = defineConfig([
  {
    name: 'project/stylistic',
    files: ['**/*.{js,mjs,ts,tsx}'],
    plugins: {
      '@stylistic': stylisticPlugin,
    },
    rules: {
      // Remove legacy formatting rules from ESLint/TypeScript ESLint
      ...stylisticPlugin.configs['disable-legacy'].rules,
      // Add recommended stylistic rules as base
      ...stylisticPlugin.configs.recommended.rules,

      // Custom style preferences (adjust to your team's preferences)
      '@stylistic/indent': ['warn', 2],
      '@stylistic/indent-binary-ops': ['warn', 2],
      '@stylistic/quotes': [
        'warn',
        'single',
        {
          avoidEscape: true,
          allowTemplateLiterals: 'always',
        },
      ],
      '@stylistic/jsx-quotes': ['warn', 'prefer-double'],
      '@stylistic/semi': ['warn', 'always'],
      '@stylistic/comma-dangle': ['warn', 'only-multiline'],
      '@stylistic/arrow-parens': [
        'warn',
        'as-needed',
        {
          requireForBlockBody: true,
        },
      ],
      '@stylistic/brace-style': [
        'warn',
        '1tbs',
        {
          allowSingleLine: true,
        },
      ],
      '@stylistic/operator-linebreak': ['warn', 'before'],

      // Imports/exports with 2+ specifiers: one per line; object literals unchanged
      '@stylistic/object-curly-newline': [
        'warn',
        {
          ImportDeclaration: { minProperties: 2 },
          ExportDeclaration: { minProperties: 2 },
          ObjectExpression: { consistent: true },
          ObjectPattern: { consistent: true },
        },
      ],

      // JSX-specific style rules
      '@stylistic/jsx-indent-props': ['warn', 2],
      '@stylistic/jsx-one-expression-per-line': 'off', // Too strict
      '@stylistic/jsx-wrap-multilines': [
        'warn',
        {
          declaration: 'parens-new-line',
          assignment: 'parens-new-line',
          return: 'parens-new-line',
          arrow: 'parens-new-line',
          condition: 'parens-new-line',
          logical: 'parens-new-line',
          prop: 'parens-new-line',
        },
      ],
      '@stylistic/jsx-curly-newline': [
        'warn',
        {
          multiline: 'consistent',
          singleline: 'forbid',
        },
      ],

      // Max line length (align with common 80–100; ignore long strings/comments to avoid noise)
      '@stylistic/max-len': [
        'warn',
        {
          code: 120,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
        },
      ],

      // Additional formatting preferences
      '@stylistic/eol-last': 'off',
      '@stylistic/padded-blocks': 'off',
      '@stylistic/spaced-comment': 'off',
      '@stylistic/multiline-ternary': 'off', // Conflicts with JSX
      '@stylistic/no-multiple-empty-lines': ['warn'],
      '@stylistic/no-trailing-spaces': ['warn'],
    },
  },
]);

// Tailwind CSS configuration
const tailwindcssConfig = defineConfig({
  name: 'custom/tailwindcss/recommended',
  files: ['**/*.ts?(x)'],
  plugins: {
    'better-tailwindcss': tailwindcssPlugin,
  },
  rules: {
    // all rules (recommended = stylistic + correctness)
    ...tailwindcssPlugin.configs.recommended.rules,
    // stylistic rules only
    //...tailwindcssPlugin.configs.stylistic.rules,
    // correctness rules only
    //...tailwindcssPlugin.configs.correctness.rules,
    // single customizations
    // https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/README.md#rules
    // https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/enforce-consistent-line-wrapping.md
    'better-tailwindcss/enforce-consistent-line-wrapping': [
      'warn',
      {
        printWidth: 120, // Maximum line length (0 = disabled)
        classesPerLine: 0, // Maximum classes per line (0 = disabled)
        group: 'newLine', // Group separation: 'emptyLine' | 'never' | 'newLine'
        preferSingleLine: true, // Keep variants on single line until limits exceeded
        indent: 2, // Indentation: number of spaces or 'tab'
        lineBreakStyle: 'unix', // Line breaks: 'windows' (\r\n) | 'unix' (\n)
      },
    ],
    'better-tailwindcss/no-unknown-classes': [
      'warn',
      {
        ignore: ['data-', 'group-', 'dark', 'toaster'],
      },
    ],
  },
  settings: {
    'better-tailwindcss': {
      // tailwindcss (4) css based
      entryPoint: 'src/app/globals.css',
      // for tailwindcss (3) with a config
      //"tailwindConfig": "tailwind.config.js"
    },
  },
});

// React Compiler configuration (experimental)
const reactCompilerConfig = defineConfig([
  {
    name: 'project/react-compiler',
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      'react-compiler': reactCompilerPlugin,
    },
    rules: {
      'react-compiler/react-compiler': 'error',
    },
  },
]);

// Export the complete configuration
// Order matters: ignores first, then general configs, then specific overrides
export default defineConfig([
  ...ignoresConfig,
  ...eslintConfig,
  ...typescriptConfig,
  ...reactConfig,
  ...stylisticConfig,
  ...tailwindcssConfig,
  ...reactCompilerConfig,
]);
