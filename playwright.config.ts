import { defineConfig, devices } from '@playwright/test';
import { appUrl, MINI_APPS } from './e2e/apps';

const PHONE = { ...devices['Pixel 7'], browserName: 'chromium' as const };

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env['CI'],
  reporter: process.env['CI'] ? 'github' : 'list',
  use: { ...PHONE, locale: 'uz-UZ' },
  projects: [
    { name: 'smoke', testMatch: ['smoke.spec.ts', 'drivers.spec.ts'] },
    { name: 'screenshots', testMatch: ['screenshots.spec.ts', 'drivers-screenshots.spec.ts'] },
  ],
  webServer: MINI_APPS.map(({ name, port }) => {
    const app = `pnpm --filter @platform/miniapp-${name}`;
    return { command: `${app} build && ${app} preview --port ${port} --strictPort`, url: appUrl(port) };
  }),
});
