import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@wildprice/shared-types': path.resolve(import.meta.dirname, '../../packages/shared-types/src/index.ts'),
      '@wildprice/trust-algorithm': path.resolve(import.meta.dirname, '../../packages/trust-algorithm/src/index.ts'),
    },
  },
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
  },
});
