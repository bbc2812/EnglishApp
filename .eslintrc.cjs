module.exports = {
  root: true,
  extends: [
    '@electron-toolkit/eslint-config-ts',
    '@electron-toolkit/eslint-config-prettier',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
  },
  ignorePatterns: [
    'out/',
    'dist/',
    'node_modules/',
    'renderer/',
    '*.config.js',
    '*.config.ts',
    'test-results/',
    'playwright.config.ts',
  ],
}
