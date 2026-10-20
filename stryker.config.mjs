// Mutation testing of the business logic (G89): Stryker changes the code of domain and application
// a little (a sign, a condition, a number) and runs the tests. A change no test notices is a place
// where a test runs the code but checks nothing. Run: pnpm mutation (docs/45).
export default {
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  // Every test runs once at the start, and the coverage of each test says which changes it reaches.
  vitest: { configFile: 'vitest.stryker.config.ts', related: false },
  // In place, not in a copy: a copy has no node_modules of apps/backend (pnpm), and every test that
  // imports hono fell out without a word (lesson №359). Nothing else may change the files meanwhile.
  inPlace: true,
  mutate: ['apps/backend/src/modules/*/{domain,application}/**/*.ts', '!**/*.test.ts'],
  // Each change runs only the tests that reach it; a value read once at import time is skipped.
  coverageAnalysis: 'perTest',
  ignoreStatic: true,
  reporters: ['clear-text', 'progress', 'json'],
  jsonReporter: { fileName: 'reports/mutation/mutation.json' },
  clearTextReporter: { allowColor: false, logTests: false, reportScoreTable: true },
  // Below 80 % the run fails: the weekly job of CI says so (G89, docs/45).
  thresholds: { high: 90, low: 80, break: 80 },
  tempDirName: '.stryker-tmp',
};
