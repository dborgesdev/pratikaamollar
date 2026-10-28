import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
export default tseslint.config({ignores:['dist/**','.wrangler/**','worker-configuration.d.ts','node_modules/**']},js.configs.recommended,{files:['tests/**/*.mjs','scripts/**/*.mjs'],languageOptions:{globals:globals.node}},...tseslint.configs.recommended,{files:['**/*.{ts,tsx}'],languageOptions:{globals:{...globals.browser,...globals.worker}}});


