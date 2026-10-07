import { defineConfig, devices } from '@playwright/test';
import { appUrl, LANDING_PORT, MINI_APPS } from './e2e/apps';

const PHONE = { ...devices['Pixel 7'], browserName: 'chromium' as const };
// A fake camera that is always allowed: tests take photos with our camera screen (docs/47).
const FAKE_CAMERA = ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'];
const CI = !!process.env['CI'];
// The screens wait for the network, not for the processor: 4 phones at once on a 4-core runner.
const CI_WORKERS = 4;
// The e2e of the map are the longest: in CI they run as a part of their own, the rest as the other
// part, so both parts end together (docs/45). Every other file is in «rest» by itself.
const MAP_SPEC = 'map.spec.ts';
const PART = process.env['E2E_PART'];
const SMOKE_PART =
  PART === 'map' ? { testMatch: [MAP_SPEC] } : PART === 'rest' ? { testIgnore: [MAP_SPEC] } : {};

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: CI,
  reporter: CI ? 'github' : 'list',
  // In CI every test goes to any part and any phone: the parts end together (docs/45).
  ...(CI ? { workers: CI_WORKERS, fullyParallel: true } : {}),
  use: { ...PHONE, locale: 'uz-UZ', launchOptions: { args: FAKE_CAMERA } },
  projects: [
    {
      name: 'smoke',
      testMatch: [
        'smoke.spec.ts',
        'drivers.spec.ts',
        'market.spec.ts',
        'bookings.spec.ts',
        'landing.spec.ts',
        'launch.spec.ts',
        'realtime.spec.ts',
        'map.spec.ts',
        'home.spec.ts',
        'look.spec.ts',
        'splash.spec.ts',
        'request.spec.ts',
      ],
      ...SMOKE_PART,
    },
    {
      name: 'screenshots',
      testMatch: [
        'screenshots.spec.ts',
        'drivers-screenshots.spec.ts',
        'market-screenshots.spec.ts',
        'bookings-screenshots.spec.ts',
        'chat-screenshots.spec.ts',
        'subscriptions-screenshots.spec.ts',
        'feedback-screenshots.spec.ts',
        'stats-screenshots.spec.ts',
        'call-screenshots.spec.ts',
        'comfort-screenshots.spec.ts',
        'legal-screenshots.spec.ts',
        'landing-screenshots.spec.ts',
        'channels-screenshots.spec.ts',
        'pitaks-screenshots.spec.ts',
        'clear-screens-screenshots.spec.ts',
        'search-android-screenshots.spec.ts',
        'g29-screenshots.spec.ts',
        'g29-more-screenshots.spec.ts',
        'tiles-screenshots.spec.ts',
        'sounds-screenshots.spec.ts',
        'registration-sizes-screenshots.spec.ts',
        'pixel-screenshots.spec.ts',
        'g59-screenshots.spec.ts',
        'g59-pixel.spec.ts',
        'g60-pixel.spec.ts',
        'g60-pixel-after.spec.ts',
        'g60-pixel-sheets.spec.ts',
        'g61-pixel.spec.ts',
        'g62-pixel.spec.ts',
        'g61-sizes-screenshots.spec.ts',
        'g62-sizes-screenshots.spec.ts',
        'look-sizes-screenshots.spec.ts',
      ],
    },
  ],
  webServer: [
    ...MINI_APPS.map(({ name, port }) => {
      const app = `pnpm --filter @platform/miniapp-${name}`;
      return { command: `${app} build && ${app} preview --port ${port} --strictPort`, url: appUrl(port) };
    }),
    {
      command: `pnpm --filter @platform/landing build && pnpm --filter @platform/landing preview --port ${LANDING_PORT} --strictPort`,
      url: appUrl(LANDING_PORT),
    },
  ],
});
