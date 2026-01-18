import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
 
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/no-deprecated': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
    },
  },
  globalIgnores([
    'src-tauri/**',
  ]),
])
 
export default eslintConfig
