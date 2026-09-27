import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['**/node_modules/', '**/dist/', '**/.turbo/', '**/coverage/']),
  js.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
]);
