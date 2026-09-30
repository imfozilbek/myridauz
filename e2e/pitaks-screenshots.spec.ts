import { expect, test, type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { mockTelegram, pressBack, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [, , ADMIN] = MINI_APPS;
const shot = (page: Page) => async (name: string) => {
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `screenshots/pitaks-${name}.png`, fullPage: true });
};
const AT = Date.now() - 3_600_000;
const pitak = (id: string, name: string, lat: number, lng: number, status: string) => ({
  id,
  name,
  point: { lat, lng },
  regionId: '1726',
  status,
  updatedAt: AT,
});
// A part of the seed of docs/73: the main pitaks chosen by Claude and a candidate (G24).
const PITAKS = [
  pitak('toshkent-avtovokzal', 'Toshkent avtovokzali', 41.2569, 69.1925, 'claude'),
  pitak('qoyliq', 'Qoʻyliq pitagi', 41.2438, 69.3394, 'claude'),
  pitak('sobir-rahimov', 'Sobir Rahimov avtostansiyasi', 41.255, 69.1961, 'candidate'),
];
const DIRECTIONS = [
  { from: '1726', to: '1718', pitakId: 'toshkent-avtovokzal' },
  { from: '1726', to: '1730', pitakId: 'qoyliq' },
  { from: '1726', to: '1733', pitakId: null },
];
const HISTORY = [
  { subject: 'direction:1726>1730', before: null, after: JSON.stringify(DIRECTIONS[1]), at: AT },
  { subject: 'pitak:qoyliq', before: null, after: JSON.stringify(PITAKS[1]), at: AT },
];

test('admin: the pitaks of the directions, a direction and the history (G24)', async ({ page }) => {
  await mockApi(page, 'active');
  await page.route('**/api/admin/pitaks', (route) =>
    route.fulfill({ json: { pitaks: PITAKS, directions: DIRECTIONS } }),
  );
  await page.route('**/api/admin/pitaks-history', (route) => route.fulfill({ json: { changes: HISTORY } }));
  const take = shot(page);
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(ADMIN.port)));
  await page.getByText(t('common.admin.management'), { exact: true }).click();
  await page.getByText(t('pitaks.title'), { exact: true }).click();
  await expect(page.getByText('Toshkent shahri → Samarqand viloyati')).toBeVisible();
  await take('1-list');
  await page.getByText('Toshkent shahri → Fargʻona viloyati').click();
  await expect(page.getByText(t('pitaks.withoutPitak'))).toBeVisible();
  await take('2-direction');
  await pressBack(page);
  await page.getByText('Sobir Rahimov avtostansiyasi').click();
  await expect(page.getByText(t('pitaks.status.candidate'))).toBeVisible();
  await take('3-pitak');
  await pressBack(page);
  await page.getByText(t('pitaks.history')).click();
  await expect(page.getByText('Qoʻshildi: Qoʻyliq pitagi · Tanlangan, tekshirilmagan')).toBeVisible();
  await take('4-history');
});
