import { defineConfig } from 'vitest/config';

// The tests of the mutation run (G89, stryker.config.mjs): every test of the backend, but the checks
// of the map data over the whole country (*-grid.test.ts, 58 000 points), which take minutes under
// Stryker; CI runs them. One project: the projects of vitest.config.ts are for the whole repo.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['apps/backend/src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/*-grid.test.ts'],
    setupFiles: ['apps/backend/src/test-offline.ts'],
  },
});
