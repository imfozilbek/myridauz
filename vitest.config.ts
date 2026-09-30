import { defineConfig } from 'vitest/config';

// Coverage rules from docs/31: business logic 90%, everything else 70%.
const BUSINESS_LOGIC_THRESHOLD = 90;
const DEFAULT_THRESHOLD = 70;
const businessLogic = { lines: BUSINESS_LOGIC_THRESHOLD, functions: BUSINESS_LOGIC_THRESHOLD };

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['{apps,packages}/*/src/**/*.test.ts', 'brands/*.test.ts', 'scripts/*.test.mjs'],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['{apps,packages}/*/src/**/*.test.tsx'],
          setupFiles: ['packages/ui/src/dom-test-setup.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: [
        '{apps,packages}/*/src/**/*.{ts,tsx}',
        'brands/*.ts',
        'brands/*/*.ts',
        'scripts/text-rules.mjs',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.d.ts',
        'apps/*/src/index.ts',
        'apps/miniapp-*/src/app/main.tsx',
        'apps/landing/src/prerender.ts',
      ],
      thresholds: {
        lines: DEFAULT_THRESHOLD,
        functions: DEFAULT_THRESHOLD,
        branches: DEFAULT_THRESHOLD,
        statements: DEFAULT_THRESHOLD,
        'apps/backend/src/modules/*/domain/**': businessLogic,
        'apps/backend/src/modules/*/application/**': businessLogic,
      },
    },
  },
});
