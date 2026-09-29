import { expect, test, type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { mockStats } from './stats-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [, , ADMIN] = MINI_APPS;
const shot = (page: Page) => async (name: string) => {
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `screenshots/stats-${name}.png`, fullPage: true });
};

// The dashboard of G12 for the owner review (docs/33): numbers, funnels, errors, the week.
test('admin: the dashboard of a day and of a week', async ({ page }) => {
  await mockApi(page, 'active');
  await mockStats(page);
  const take = shot(page);
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(ADMIN.port)));
  await page.getByText(t('common.admin.management'), { exact: true }).click();
  await page.getByText(t('common.admin.statistics'), { exact: true }).click();
  await expect(page.getByText(t('stats.number.newUsers'))).toBeVisible();
  await expect(page.getByText(t('stats.left', { drop: 60 }))).toBeVisible();
  await take('1-day');
  await page.getByText(t('stats.period.week')).click();
  await expect(page.getByText('168').first()).toBeVisible();
  await take('2-week');
  // A signal of the admin bot opens the dashboard at once.
  await page.goto(telegramUrl(`${appUrl(ADMIN.port)}?stats=day`));
  await expect(page.getByText(t('stats.funnel.passenger'))).toBeVisible();
  await take('3-from-bot');
});
