import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import jest from 'eslint-plugin-jest';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        Buffer: 'readonly',
        performance: 'readonly',
        HTMLElement: 'readonly',
        File: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        require: 'readonly',
        global: 'readonly',
        self: 'readonly',
        Element: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      // Add any custom rules here
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx,js}', 'src/**/tests/**/*.{ts,tsx,js}'],
    ...jest.configs['flat/recommended'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: {
        ...jest.configs['flat/recommended'].languageOptions?.globals,
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        Buffer: 'readonly',
        performance: 'readonly',
        HTMLElement: 'readonly',
        File: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        require: 'readonly',
        global: 'readonly',
        self: 'readonly',
        Element: 'readonly',
      },
    },
    plugins: {
      ...jest.configs['flat/recommended'].plugins,
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...jest.configs['flat/recommended'].rules,
      ...tseslint.configs.recommended.rules,
      // Relax rules for tests
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      // Jest plugin handles unused vars in test contexts
      'no-unused-vars': 'off',
    },
  },
  {
    ignores: ['build/**', 'lib/**', 'node_modules/**'],
  },
];