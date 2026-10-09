import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, test, type Page } from './crash-guard';
import { openDriverHome } from './g66-driver-mock';
import { openPassengerHome } from './g66-home-mock';

// Pixel Perfect of the main screens (G66, lessons 141, 147, 167): the phones of g66/1 and g66/2 at
// the size and scale of the mockup (360 × 760 at 1.5) with the data of the mockup; the diff is read
// by scripts/pixel-diff.py.
const { t } = createI18n(DEFAULT_LOCALE);
const OUT = 'screenshots/pixel-g66';
test.use({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 1.5 });

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });

test('1-passenger-1: nothing yet, «Qayerdan» where Madina stands', async ({ page }) => {
  await openPassengerHome(page);
  await expect(page.getByText(t('home.dock.here'))).toBeVisible();
  await shot(page, '1-passenger-1');
});

test('1-passenger-2: «Qayerga» chosen, the trips of today and tomorrow', async ({ page }) => {
  await openPassengerHome(page);
  await page.getByText(t('way.toEmpty')).click();
  await page.locator('.direction-card', { hasText: 'Samarqand' }).first().click();
  await expect(page.getByText(t('home.dock.trips', { today: '3', tomorrow: '8' }))).toBeVisible();
  await shot(page, '1-passenger-2');
});

test('1-passenger-3: a seat tomorrow and a request with offers', async ({ page }) => {
  await openPassengerHome(page, 'trip');
  await expect(page.getByText('Jasur', { exact: false }).first()).toBeVisible();
  await shot(page, '1-passenger-3');
});

for (const [n, state] of [
  ['1', 'pending'],
  ['2', 'free'],
  ['3', 'tomorrow'],
  ['4', 'today'],
] as const) {
  test(`2-driver-${n}: ${state}`, async ({ page }) => {
    await openDriverHome(page, state);
    await page.waitForLoadState('networkidle');
    await shot(page, `2-driver-${n}`);
  });
}
