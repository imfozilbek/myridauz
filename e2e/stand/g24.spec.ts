import { expect, test, type Page } from '../crash-guard';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { telegramEvents } from '../telegram-mock';
import { answer, book, BUXORO, cancelMine, CHILONZOR, publishTrip } from './market-kit';
import { GULNORA, KAMOLA, LOLA, SARDOR, SHAHNOZA } from './people';
import { openAs, outsideCalls } from './stand-kit';

const { t } = createI18n(DEFAULT_LOCALE);
const shot = (page: Page, name: string) =>
  page.screenshot({ path: `screenshots/stand/g24/${name}.png`, animations: 'disabled' });
const mainButton = (page: Page) => page.locator('#tg-main-button');

// Checks 3 and 4 of the owner for G24 (docs/70) on the whole local Rida; checks 1 and 2 became the
// booking of G26 (g26.spec.ts). Sardor goes from Chilonzor to Buxoro shahri with Shahnoza.
test.describe.configure({ mode: 'serial' });
test.afterEach(() => expect(outsideCalls()).toEqual([]));

const CHILONZOR_POINT = { lat: 41.2847, lng: 69.2152 };
const BUXORO_POINT = { lat: 39.776, lng: 64.4152 };

test.beforeAll(async () => {
  const trip = await publishTrip(SARDOR, CHILONZOR, BUXORO, 'door');
  const shahnoza = await book(SHAHNOZA, trip, {
    seats: 1,
    mode: 'door',
    pickup: CHILONZOR_POINT,
    dropoff: BUXORO_POINT,
  });
  await answer(SARDOR, shahnoza.id, 'confirm');
  // Gulnora books and cancels: her points are erased at once (docs/69).
  const gulnora = await book(GULNORA, trip, {
    seats: 1,
    mode: 'door',
    pickup: { lat: 41.3, lng: 69.24 },
    dropoff: { lat: 39.78, lng: 64.43 },
  });
  await cancelMine(GULNORA, gulnora.id);
  // Two seat requests wait for the driver: Kamola a few hundred metres from the way, Lola in
  // Yunusobod, more than 10 km off it.
  const near = { pickup: { lat: 41.29, lng: 69.22 }, dropoff: { lat: 39.77, lng: 64.42 } };
  await book(KAMOLA, trip, { seats: 1, mode: 'door', ...near });
  const far = { pickup: { lat: 41.3515, lng: 69.299 }, dropoff: BUXORO_POINT };
  await book(LOLA, trip, { seats: 1, mode: 'door', ...far });
});

// The trip of Sardor in «Mening safarlarim».
async function openTrip(page: Page) {
  await openAs(page, 'driver', SARDOR);
  await page.getByText(t('common.myTrips')).click();
  await page.locator('.trip-card').first().click();
}

test('3. the driver sees the requests near the way first', async ({ page }) => {
  await openTrip(page);
  const headers = page.getByText(new RegExp(`^(${t('way.driver.fits')}|${t('way.driver.others')})$`, 'u'));
  await expect(headers).toHaveText([t('way.driver.fits'), t('way.driver.others')]);
  // Kamola stands under «Bu safarga mos», Lola under «Boshqa soʻrovlar»: top to bottom.
  const top = async (text: string) => (await page.getByText(text, { exact: true }).boundingBox())?.y ?? 0;
  expect(await top(t('way.driver.fits'))).toBeLessThan(await top(KAMOLA.name));
  expect(await top(KAMOLA.name)).toBeLessThan(await top(t('way.driver.others')));
  expect(await top(t('way.driver.others'))).toBeLessThan(await top(LOLA.name));
  await page.getByText(LOLA.name, { exact: true }).scrollIntoViewIfNeeded();
  await shot(page, '3-requests');
});

test('4. the map of the trip opens the stops in the navigator; a cancelled seat has no point', async ({
  page,
}) => {
  await openTrip(page);
  await page.getByText(t('way.map.title')).click();
  await expect(page.locator('[data-state="ready"]').first()).toBeVisible();
  await page.waitForLoadState('networkidle');
  await expect(page.getByText(SHAHNOZA.name).first()).toBeVisible();
  await expect(page.getByText(GULNORA.name)).toHaveCount(0);
  await shot(page, '4-trip-map');
  await mainButton(page)
    .filter({ hasText: t('way.map.go') })
    .click();
  await expect.poll(async () => (await telegramEvents(page, 'web_app_open_link')).length).toBe(1);
  const [opened] = await telegramEvents(page, 'web_app_open_link');
  expect(String(opened?.url)).toMatch(/^https:\/\/yandex\.uz\/maps\/\?rtext=~/u);
  await page.getByText(t('way.map.dropoffs')).click();
  await expect(page.getByText(SHAHNOZA.name).first()).toBeVisible();
  await shot(page, '4-dropoffs');
});
