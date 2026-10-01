import { defineConfig, devices } from '@playwright/test';
import { STAND_API_PORT } from './scripts/stand/paths.ts';

// pnpm stand:check: the scenarios on the whole local Rida (docs/75), no mocks of the API.
// Android first, as most people in Uzbekistan use it (lesson 52).
const BUILD_AND_START_MS = 10 * 60 * 1000;

export default defineConfig({
  testDir: 'e2e/stand',
  workers: 1,
  reporter: 'list',
  globalSetup: './e2e/stand/seed.ts',
  // A fake camera that is always allowed: the driver takes photos with our camera screen (docs/47).
  use: {
    ...devices['Pixel 7'],
    browserName: 'chromium',
    locale: 'uz-UZ',
    launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
  },
  webServer: {
    // Every check starts from the clean stand: the same data each time.
    command: 'pnpm stand --fresh',
    url: `http://localhost:${STAND_API_PORT}/health`,
    timeout: BUILD_AND_START_MS,
    // STAND_REUSE=1: the checks run on a stand already started by hand, to read its log (docs/75).
    reuseExistingServer: process.env['STAND_REUSE'] === '1',
  },
});
