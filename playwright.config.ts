import { defineConfig, devices } from '@playwright/test';
import { appUrl, MINI_APPS } from './e2e/apps';

const PHONE = { ...devices['Pixel 7'], browserName: 'chromium' as const };
// A fake camera that is always allowed: tests take photos with our camera screen (docs/47).
const FAKE_CAMERA = ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'];

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env['CI'],
  reporter: process.env['CI'] ? 'github' : 'list',
  use: { ...PHONE, locale: 'uz-UZ', launchOptions: { args: FAKE_CAMERA } },
  projects: [
    { name: 'smoke', testMatch: ['smoke.spec.ts', 'drivers.spec.ts', 'market.spec.ts', 'bookings.spec.ts'] },
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
      ],
    },
  ],
  webServer: MINI_APPS.map(({ name, port }) => {
    const app = `pnpm --filter @platform/miniapp-${name}`;
    return { command: `${app} build && ${app} preview --port ${port} --strictPort`, url: appUrl(port) };
  }),
});
