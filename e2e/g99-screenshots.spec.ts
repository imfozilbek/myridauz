import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, test, type Page } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { mockPaths } from './paths-mock';
import { mockStats } from './stats-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [, , ADMIN] = MINI_APPS;
// The new sections fill more than a phone screen: each picture starts at its own heading.
const shot = (page: Page) => async (name: string, from?: string) => {
  await page.mouse.move(0, 0);
  if (from)
    await page
      .getByText(from, { exact: true })
      .first()
      .evaluate((node) => node.scrollIntoView());
  await page.screenshot({ path: `screenshots/g99-${name}.png`, fullPage: !from });
};

// G99 (docs/234) for the owner review (docs/33): «Yoʻl manbalari», «Telegram versiyalari», a slice,
// the file of the analyst and the period «30 kun».
test('admin: the paths by source and Telegram', async ({ page }) => {
  await mockApi(page, 'active');
  await mockStats(page);
  await mockPaths(page);
  const take = shot(page);
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(ADMIN.port)));
  await page.getByText(t('common.admin.management'), { exact: true }).click();
  await page.getByText(t('common.admin.statistics'), { exact: true }).click();
  await page.getByText(t('stats.period.month')).click();
  await expect(page.getByText(t('stats.paths.sources'))).toBeVisible();
  await take('1-yol-manbalari', t('stats.paths.sources'));
  await take('2-telegram-versiyalari', t('stats.paths.versions'));
  await page.getByText(t('stats.paths.fileHint')).click();
  await expect(page.getByText(t('stats.paths.fileSent'))).toBeVisible();
  await take('3-fayl', t('stats.paths.platforms'));
  await page.getByText(t('stats.paths.row', { people: '42', errors: '3' })).click();
  await expect(page.getByText(t('stats.step.first_booking'))).toBeVisible();
  await take('4-kanal');
});
