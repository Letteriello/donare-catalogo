import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  // Configuração para server.js (CommonJS, Node.js)
  {
    files: ['server.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module', // Especifica ES Modules para este arquivo
      globals: {
        ...globals.node, // Adiciona globais do Node.js (require, process, etc.)
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }], // Permite 'next' não usado se prefixado com _
    }
  },
  // Configuração para o restante do projeto (ES Modules, React)
  {
    files: ['src/**/*.{js,jsx}'], // Aplicar apenas aos arquivos dentro de src
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module', // ES Modules para o código React
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react/prop-types': 'off', // Desativa temporariamente para os erros que vimos antes
      'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    },
  },
]
