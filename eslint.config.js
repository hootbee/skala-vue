import js from '@eslint/js'
import globals from 'globals'
import vue from 'eslint-plugin-vue'

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'doc/**'],
  },
  js.configs.recommended,
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
    },
  },
]
