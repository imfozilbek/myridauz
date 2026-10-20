import { mergeConfig } from 'vitest/config';
import base from './vitest.config';

// The tests of the mutation run (G89, stryker.config.mjs): all but the checks of the map data over
// the whole country (*-grid.test.ts, 58 000 points), which take minutes under Stryker. CI runs them.
export default mergeConfig(base, {
  test: { exclude: ['**/node_modules/**', '**/*-grid.test.ts'] },
});
