module.exports = {
  env: {
    browser: false,
    es6: true,
    jest: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    // 'plugin:@typescript-eslint/recommended-requiring-type-checking', // some day, maybe
    'prettier', // Prettier always has the final say
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      'impliedStrict': true,
    },
    ecmaVersion: 2021, // Node 16
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
    'prettier', // Prettier always has the final say
  ],
  root: true, // do not inherit '~/.eslintrc'
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'prettier/prettier': 'warn',

    // neutralize all TypeScript & other non-recommended rules;
    //   we will incrementally introduce what we want over time
    'no-irregular-whitespace': 'error',
    'no-case-declarations': 'error',
    'no-unused-labels': 'error',
    '@typescript-eslint/no-empty-interface': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-non-null-assertion': 'warn',
  },
};
