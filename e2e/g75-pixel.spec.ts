import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { expect, test } from './crash-guard';
import { mockLists } from './g75-lists-mock';
import { tripOf } from './market-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

// Pixel Perfect of the state screens (G75, lessons 141, 147): the phones of g75/1 A at the size of the
// mockup (360 × 760 at 1); the diff is read by scripts/pixel-diff.py.
const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER, DRIVER] = MINI_APPS;
const OUT = 'screenshots/pixel-g75';
test.use({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 1 });

test('1-1: «Hisobingiz bloklangan»', async ({ page }) => {
  await mockApi(page, 'blocked');
  await page.route('**/api/me', (route) =>
    route.fulfill({ json: { state: 'blocked', until: Date.parse('2026-10-14T07:00:00Z') } }),
  );
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await expect(page.locator('.empty-state')).toBeVisible();
  await page.screenshot({ path: `${OUT}/1-1-code.png`, animations: 'disabled' });
});

test('1-2: «Ilovani qayta oching»', async ({ page }) => {
  await mockApi(page, 'active');
  await page.route('**/api/me', (route) => route.fulfill({ status: 401, json: { error: 'auth.expired' } }));
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await expect(page.locator('.empty-state')).toBeVisible();
  await page.screenshot({ path: `${OUT}/1-2-code.png`, animations: 'disabled' });
});

test('1-3: «Faol safarlar 3 ta» of a driver', async ({ page }) => {
  await mockApi(page, 'active');
  const trips = ['1', '2', '3'].map((id) => tripOf(id, 'Jasur', false, 24 * Number(id)));
  await page.route('**/api/driver/trips', (route) => route.fulfill({ json: { trips } }));
  await mockTelegram(page);
  await page.goto(telegramUrl(`${appUrl(DRIVER.port)}?open=new_trip`));
  await expect(page.locator('.empty-state')).toBeVisible();
  await page.screenshot({ path: `${OUT}/1-3-code.png`, animations: 'disabled' });
});

// Sheet 2 A: the lists of a passenger.
for (const [n, empty] of [
  ['1', false],
  ['2', true],
] as const)
  test(`2-${n}: «Mening safarlarim» ${empty ? 'empty' : 'with a seat and requests'}`, async ({ page }) => {
    await mockApi(page, 'active');
    await mockLists(page, empty);
    await mockTelegram(page);
    await page.goto(telegramUrl(appUrl(PASSENGER.port)));
    await page.getByText(t('common.myTrips'), { exact: true }).first().click();
    await expect(page.getByText(empty ? t('market.mine.noLive') : t('market.mine.again'))).toBeVisible();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${OUT}/2-${n}-code.png`, animations: 'disabled' });
  });

test('2-3: «Obunalar»', async ({ page }) => {
  await mockApi(page, 'active');
  await mockLists(page);
  await mockTelegram(page);
  await page.goto(telegramUrl(`${appUrl(PASSENGER.port)}?subscriptions=1`));
  await expect(page.getByText(t('subscriptions.hint'))).toBeVisible();
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${OUT}/2-3-code.png`, animations: 'disabled' });
});
