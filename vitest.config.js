import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // お手本(.reference/)のテストを拾わないよう、対象を明示する
    include: ['tests/**/*.test.js', 'packages/dashboard/test/**/*.test.js'],
  },
});
