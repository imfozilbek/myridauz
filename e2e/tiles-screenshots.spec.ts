import { expect, test, type Page } from './crash-guard';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { mockTeam } from './team-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

// The main screen of the team (G75, mockup g67/1); the passenger and the driver: g66-*.spec.ts.
const { t } = createI18n(DEFAULT_LOCALE);
const [, , ADMIN] = MINI_APPS;
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

    test('admin: the owner and a moderator (G75)', async ({ page }) => {
      const go = await open(page, ADMIN.port);
      await mockTeam(page, 'owner');
      await go();
      await expect(page.getByText(t('team.diqqat.errors', { count: 2 }))).toBeVisible();
      await expect(page.getByText(t('common.admin.management'))).toBeVisible();
      await shot(page, 'a1-owner');
      await mockTeam(page, 'moderator');
      await page.reload();
      await expect(page.getByText(t('team.work.done'))).toBeVisible();
      await shot(page, 'a2-moderator');
    });
  });
}
