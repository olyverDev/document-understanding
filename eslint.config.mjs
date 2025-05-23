import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

const tsConfig = await tseslint.config({
  files: ['**/*.ts'],
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  linterOptions: {
    reportUnusedDisableDirectives: true,
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-empty': ['error', { allowEmptyCatch: true }],
  },
  plugins: {
    import: await import('eslint-plugin-import'),
    jest: await import('eslint-plugin-jest'),
  },
  extends: [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettier,
    {
      rules: {
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'import/order': [
          'warn',
          {
            groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
            alphabetize: { order: 'asc', caseInsensitive: true },
            'newlines-between': 'always',
          },
        ],
      },
    },
  ],
});

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
  ...tsConfig,
  {
    files: ['*.d.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
