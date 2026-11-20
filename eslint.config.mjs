import eslint from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '**/.next/**',
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      'tools/workspace-check/fixtures/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{cjs,mjs,js,jsx,ts,tsx}'],
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/root-path': '.',
      'import/resolver': {
        node: {
          extensions: ['.js', '.mjs', '.ts', '.tsx'],
        },
        typescript: {
          alwaysTryTypes: true,
          extensions: ['.js', '.mjs', '.ts', '.tsx'],
          project: './tsconfig.base.json',
        },
      },
      'boundaries/elements': [
        {
          type: 'domain',
          pattern: 'packages/domain/*',
          capture: ['module'],
          partialMatch: false,
        },
        {
          type: 'package',
          pattern: 'packages/*',
          capture: ['package'],
          partialMatch: false,
        },
        {
          type: 'app',
          pattern: 'apps/*',
          capture: ['app'],
          partialMatch: false,
        },
      ],
      'boundaries/elements-single-match': true,
      'boundaries/files': [
        {
          category: 'public',
          pattern: 'packages/domain/*/public.ts',
        },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          checkInternals: true,
          policies: [
            {
              from: { element: { type: 'domain' } },
              allow: {
                to: {
                  element: {
                    type: 'domain',
                    captured: { module: '{{ from.element.captured.module }}' },
                  },
                },
              },
            },
            {
              from: { element: { type: 'domain' } },
              allow: { to: { file: { categories: 'public' } } },
            },
            {
              from: { element: { type: 'domain' } },
              allow: {
                to: {
                  element: {
                    type: 'package',
                    captured: { package: ['contracts', 'db', 'adapters'] },
                  },
                },
              },
            },
            {
              from: { element: { type: 'package' } },
              allow: { to: { element: { type: 'package' } } },
            },
            {
              from: { element: { type: 'package' } },
              allow: { to: { file: { categories: 'public' } } },
            },
            {
              from: { element: { type: 'app' } },
              allow: { to: { element: { type: 'package' } } },
            },
            {
              from: { element: { type: 'app' } },
              allow: { to: { file: { categories: 'public' } } },
            },
          ],
        },
      ],
    },
  },
];
