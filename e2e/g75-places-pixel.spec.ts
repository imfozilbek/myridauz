import { DAY_MS, tashkentDate } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, openFindTrip, TEXT } from './apps';
import { noSeatYet } from './bookings-mock';
import { expect, test, type Page } from './crash-guard';
import { fillCar } from './driver-application';
import { MAN, mockupData } from './g59-pixel-mock';
import { openTripAt } from './g63-pixel-mock';
import { startPublish } from './g63-publish-mock';
import { mapState, mockMap } from './map-mock';
import { TILES_MS } from './map-wait';
import { mockTelegram, telegramUrl } from './telegram-mock';

// Pixel Perfect of «Joylar, xarita va kamera» (G75, lessons 141, 147, 160): the phones of g75/6 A at
// the size of the mockup (360 × 760 at 1). The map is drawn from real tiles: only its sheet is laid
// over the mockup, the camera without the picture of the fake camera.
const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER, DRIVER] = MINI_APPS;
const OUT = 'screenshots/pixel-g75';
test.use({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 1 });

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });

// The places of the mockup: Samarqand shahri 8, Urgut 3, Kattaqoʻrgʻon shahri 2, Pastdargʻom 1.
const PLACES = [
  { to: '1718401', trips: 8 },
  { to: '1718236', trips: 3 },
  { to: '1718406', trips: 2 },
  { to: '1718227', trips: 1 },
];

test('6-1: «Samarqandning qaysi joyi?» with the trips of each place', async ({ page }) => {
  await mockApi(page, 'active');
  await mockMap(page, mapState());
  await noSeatYet(page);
  await page.addInitScript(() => localStorage.setItem('here_district', '1726294'));
  await mockupData(page);
  const days = [3, 8, 3, 0, 0, 0, 0].map((trips, index) => ({
    date: tashkentDate(Date.now() + index * DAY_MS),
    trips,
  }));
  await page.route('**/api/trips/days?*', (route) =>
    route.fulfill({ json: { km: 300, days, places: PLACES } }),
  );
  await page.route('**/api/me', (route) => route.fulfill({ json: { state: 'active', profile: MAN } }));
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await openFindTrip(page);
  await page.locator('.direction-card').first().click();
  await page.getByText(t('find.district', { region: 'Samarqand' })).click();
  await expect(page.locator('.district-whole')).toContainText('14');
  await shot(page, '6-1');
});

test('6-2: «Qayerdan olasiz?», the pitak on the map with its sheet', async ({ page }) => {
  await startPublish(page);
  await page.getByText(t('way.trip.onMap')).click();
  await expect(page.locator('.pitak-map[data-state="ready"]')).toBeVisible();
  await page.waitForTimeout(TILES_MS);
  await shot(page, '6-2');
});

test('6-3: «Qaysi navigatorda ochamiz?» the first time', async ({ page }) => {
  await openTripAt(page, '2026-10-06T14:20', true);
  await page.getByText(t('driverTrip.tile.map')).click();
  await page.locator('#tg-main-button', { hasText: t('way.map.go') }).click();
  await expect(page.getByText(t('way.map.navigatorKept'))).toBeVisible();
  await page.waitForTimeout(TILES_MS);
  await shot(page, '6-3');
});

test('6-4: the camera of the front photo with the car line', async ({ page }) => {
  await mockApi(page, 'active', 'none');
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(DRIVER.port)));
  await fillCar(page);
  await page.locator('#tg-main-button').click();
  await page.locator('.photo-tile', { hasText: TEXT.photoFront }).click();
  await page.getByRole('dialog').getByLabel(TEXT.shutter).waitFor();
  await page
    .locator('.camera-video')
    .evaluate((video) => ((video as HTMLElement).style.visibility = 'hidden'));
  await shot(page, '6-4');
});
