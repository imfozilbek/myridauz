// Mutation testing of the business logic (G89): Stryker changes the code of domain and application
// a little (a sign, a condition, a number) and runs the tests. A change no test notices is a place
// where a test runs the code but checks nothing. Run: pnpm mutation (docs/45).
export default {
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  // Every test runs once at the start: «related» of vitest missed most tests in the sandbox of Stryker
  // (lesson №359), and the coverage of each test says which changes it reaches.
  vitest: { configFile: 'vitest.stryker.config.ts', related: false },
  mutate: ['apps/backend/src/modules/*/{domain,application}/**/*.ts', '!**/*.test.ts'],
  // Each change runs only the tests that reach it; a value read once at import time is skipped.
  coverageAnalysis: 'perTest',
  ignoreStatic: true,
  reporters: ['clear-text', 'progress', 'json'],
  jsonReporter: { fileName: 'reports/mutation/mutation.json' },
  clearTextReporter: { allowColor: false, logTests: false, reportScoreTable: true },
  thresholds: { high: 90, low: 80, break: null },
  tempDirName: '.stryker-tmp',
};
