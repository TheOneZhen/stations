import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  // ESLint stylistic rules format JS/TS; formatters handle css/html/md
  formatters: {
    css: true,
    html: true,
    markdown: 'prettier',
  },
  jsonc: true,
  yaml: false,
  markdown: false,
  pnpm: true,
  rules: {
    'pnpm/json-enforce-catalog': 'off',
    'no-unused-vars': [1],
    'no-console': 'off',
    'import/no-mutable-exports': 'off',
    'antfu/no-top-level-await': 'off',
  },
})
