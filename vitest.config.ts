import { defineConfig } from 'vitest/config';

// リポジトリ全体の構成テスト（tests/）。各ワークスペースのテストはそれぞれの `pnpm test` で実行する。
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
