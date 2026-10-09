import { expect, test, type Page } from './crash-guard';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { mockFeedback } from './feedback-mock';
import { mockStats } from './stats-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

// The main screen of the team as tiles (G53, docs/114); the passenger and the driver: g66-*.spec.ts.
const { t } = createI18n(DEFAULT_LOCALE);
const [, , ADMIN] = MINI_APPS;
const json = (page: Page, path: string, body: unknown) =>
  page.route(path, (route) => route.fulfill({ json: body }));
const ANDROID = { width: 360, height: 800 };

for (const platform of ['android', 'ios'] as const) {
  test.describe(platform, () => {
    if (platform === 'android') test.use({ viewport: ANDROID });
    const shot = (page: Page, name: string) =>
      page.screenshot({ path: `screenshots/tiles-${platform}-${name}.png` });
    const open = async (page: Page, port: number) => {
      await mockApi(page, 'active');
      await mockTelegram(page);
      return () => page.goto(telegramUrl(appUrl(port), platform));
    };

    test('admin C: work waits, all done', async ({ page }) => {
      const go = await open(page, ADMIN.port);
      await mockFeedback(page);
      await mockStats(page);
      await go();
      await expect(page.getByText(t('home.admin.newUsers'))).toBeVisible();
      await expect(page.getByText(t('home.admin.waiting'))).toBeVisible();
      await shot(page, 'a1-work');
      await json(page, '**/api/admin/applications', { applications: [] });
      await json(page, '**/api/admin/complaints', { complaints: [] });
      await page.reload();
      await expect(page.getByText(t('common.admin.management'))).toBeVisible();
      await shot(page, 'a2-done');
    });
  });
}
