module.exports = {
  arrowParens: 'always',
  bracketSameLine: false,
  bracketSpacing: true,
  embeddedLanguageFormatting: 'auto',
  htmlWhitespaceSensitivity: 'css',
  insertPragma: false,
  // jsxBracketSameLine: false, // supposedly deprecated?
  jsxSingleQuote: false,
  parser: 'typescript',
  proseWrap: 'preserve',
  quoteProps: 'preserve',
  requirePragma: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  printWidth: 120,
  overrides: [
    {
      files: ['**/*.json', '.lintstagedrc'],
      options: {
        parser: 'json',
      },
    },
    {
      files: ['**/*.ts'],
      options: {
        requirePragma: false,
      },
    },
  ],
};
