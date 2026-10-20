import { DAY_MS, HOUR_MS, tashkentDate } from '@platform/contracts';
import type { Page } from '@playwright/test';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, openFindTrip } from './apps';
import { noSeatYet } from './bookings-mock';
import { expect, test } from './crash-guard';
import { MAN, mockupData } from './g59-pixel-mock';
import { startPublish } from './g63-publish-mock';
import { mapState, mockMap } from './map-mock';
import { TILES_MS } from './map-wait';
import { tripOf } from './market-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

// Pixel Perfect of «Oraliqda» (G90, lessons 141, 147): the phones of g90 at the size of the mockup
// (360 × 760 at 2), the same data and taps as the mockup, the code as it is.
const [PASSENGER] = MINI_APPS;
const OUT = 'screenshots/pixel-g90';
test.use({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 2 });
const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });
const tile = (page: Page, time: string) => page.getByRole('button', { name: time, exact: true });

test('1 … 4: the driver chooses 08:00 … 10:00 tomorrow', async ({ page }) => {
  await page.clock.setFixedTime(Date.parse('2026-10-20T10:00:00+05:00'));
  await startPublish(page);
  const when = () => page.getByText(/^(Bugun|Ertaga), \d\d:\d\d( dan \d\d:\d\d gacha)?$/u);
  await when().click();
  await page.locator('.week-day').nth(1).click();
  await page.getByText('Oraliqda', { exact: true }).click();
  await expect(page.getByText('Qaysi soatdan? Toshkent vaqti bilan')).toBeVisible();
  await shot(page, '1-from');
  await tile(page, '08:00').click();
  await expect(page.getByText('08:00 dan qaysi soatgacha? Eng koʻpi 3 soat')).toBeVisible();
  await shot(page, '2-to');
  await tile(page, '10:00').click();
  await expect(page.getByText('Ertaga, 08:00 dan 10:00 gacha')).toBeVisible();
  await page.mouse.move(0, 0);
  await shot(page, '4-form');
  await when().click();
  await expect(tile(page, '10:00')).toHaveAttribute('aria-pressed', 'true');
  await shot(page, '3-chosen');
});

test('5, 6: the passenger sees 08:00 … 10:00 without the arrival', async ({ page }) => {
  await mockApi(page, 'active');
  await mockMap(page, mapState());
  await noSeatYet(page);
  await page.addInitScript((id) => localStorage.setItem('here_district', id), '1726294');
  await mockupData(page);
  const tomorrow = tashkentDate(Date.now() + DAY_MS);
  const departAt = Date.parse(`${tomorrow}T08:00:00+05:00`);
  const range = tripOf('1', 'Jasur', false, 0, { departAt, departUntil: departAt + 2 * HOUR_MS });
  const nodira = tripOf('2', 'Nodira', true, 0, { departAt: departAt + 5 * HOUR_MS, seatsLeft: 2 });
  // As in the mockup: two trips of one seat hidden by «2» people.
  const hidden = (id: string, name: string, hours: number) =>
    tripOf(id, name, false, 0, { departAt: departAt + hours * HOUR_MS, seatsLeft: 1 });
  const trips = [
    range,
    { ...nodira, driver: { ...nodira.driver, rating: { average: 4.8, count: 23 } } },
    hidden('3', 'Bekzod', 7),
    hidden('4', 'Akmal', 9),
  ];
  await page.route('**/api/trips?*', (route) => route.fulfill({ json: { trips } }));
  await page.route('**/api/me', (route) => route.fulfill({ json: { state: 'active', profile: MAN } }));
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port), 'android'));
  await openFindTrip(page);
  await page.locator('.direction-card').first().click();
  await expect(page.locator('.search-trip').first()).toBeVisible();
  await page.locator('.week-day').nth(1).click();
  await page.getByRole('button', { name: '2', exact: true }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('08:00 … 10:00')).toBeVisible();
  await shot(page, '5-list');
  await page.locator('.search-trip').first().click();
  await expect(page.locator('.area-map-box[data-state="ready"]')).toBeVisible();
  await page.waitForTimeout(TILES_MS);
  await expect(page.getByText('08:00 … 10:00')).toBeVisible();
  await shot(page, '6-trip');
});
