import { openWallet } from './bookings';
import { expect, test } from './crash-guard';
import {
  akmal,
  fiveStars,
  live,
  madina,
  mockupWallet,
  pastList,
  pastSeats,
  pastTrip,
} from './g63-after-data';
import { mockupTrip, openDriver, openTrip, part, seat, shot, t, tashkent } from './g63-after-mock';
import { TILES_MS } from './map-wait';

// Pixel Perfect of the meeting and the end of the trip of the driver (G63 C3, lessons 141, 147, 160):
// screens 13, 15, 16 of g63/4-journey-driver.png and the six phones of g63/5-after-trip-driver.png
// at the size and the scale of the mockup phones (360 × 759 at 1.25) with the data of the mockups.
test.use({ viewport: { width: 360, height: 759 }, deviceScaleFactor: 1.25 });

test('13: «Uchrashuv», Madina at the point (g63/4 screen 13)', async ({ page }) => {
  const came = madina({ cameAt: tashkent('2026-10-07T07:40') });
  await openDriver(page, '2026-10-07T07:45', { trips: [live], bookings: [came] });
  await openTrip(page);
  await page.getByText(t('driverTrip.tile.map')).click();
  await page.locator('.trip-map-stop').first().click();
  await expect(page.getByText('Madina keldi: uchrashuv joyida')).toBeVisible();
  await expect(page.locator('.meeting-map-box[data-state="ready"]')).toBeVisible();
  await page.waitForTimeout(TILES_MS);
  await shot(page, 'journey-13');
});

// Phone 1 is «Mening safarim» of C2 with the parts of C3 on it: the whole page, and each part
// against its own piece of the mockup (lesson 160): the plate «Akmal kelmadi» and the line under
// Akmal once the driver is at his point («Men keldim», docs/126).
test('5-1: «Kelmadi» on the own trip, after and before the mark (g63/5 phone 1)', async ({ page }) => {
  const met = madina({ metAt: tashkent('2026-10-07T07:20') });
  const gone = akmal({ noShowAt: tashkent('2026-10-07T07:25') });
  await openDriver(page, '2026-10-07T07:30', { trips: [live], bookings: [met, gone] });
  await openTrip(page);
  await expect(page.getByText('Akmal kelmadi')).toBeVisible();
  await shot(page, 'after-01');
  await part(page.locator('.no-show-banner'), 'after-01-banner');
  const there = akmal({ driverCameAt: tashkent('2026-10-07T07:28') });
  await page.route('**/api/driver/bookings', (route) => route.fulfill({ json: { bookings: [met, there] } }));
  await page.reload();
  await openTrip(page);
  await expect(page.getByText(t('driverAfter.noShow.until'))).toBeVisible();
  await part(page.locator('.no-show-mark'), 'after-01-line');
});

// Phones 2 and 3 of g63/5 are screens 15 and 16 of g63/4: the stars, then «Qaytish».
test('5-2, 5-3: «Safar tugadi» and «Qaytish» (g63/4 screens 15, 16)', async ({ page }) => {
  const trip = mockupTrip({ price: 100000 });
  const seats = [seat(trip, '1', 'Madina', 2), seat(trip, '3', 'Sardor', 1)];
  await openDriver(page, '2026-10-07T20:00', { trips: [trip], bookings: seats });
  await openTrip(page);
  await page.getByText(t('driverAfter.past.rate')).click();
  await expect(page.getByText(/Qoldi ≈.11 joyga yetadi/u)).toBeVisible();
  await shot(page, 'after-02');
  await page.locator('#tg-main-button').click();
  await expect(page.getByText(/4 ta soʻrov bor/u)).toBeVisible();
  await shot(page, 'after-03');
});

test('5-5: the past trip (g63/5 phone 5)', async ({ page }) => {
  await page.route('**/api/reviews/*', (route) => route.fulfill({ json: fiveStars }));
  await openDriver(page, '2026-10-07T20:00', { trips: [pastTrip], bookings: pastSeats });
  await openTrip(page);
  await expect(page.getByText(/^Baho: ★★★★★/u)).toBeVisible();
  await shot(page, 'after-05');
});

test('5-4: the past trips with what is left (g63/5 phone 4)', async ({ page }) => {
  await openDriver(page, '2026-10-08T10:00', pastList);
  await page.getByText(t('common.myTrips')).click();
  await expect(page.getByText(t('driverAfter.tag.rated'))).toBeVisible();
  await page.getByText(t('driverAfter.tag.refund')).scrollIntoViewIfNeeded();
  await shot(page, 'after-04');
  // The list itself is redesigned by G64: the tags of C3 alone.
  const tags = page.locator('.past-tags');
  await part(tags.nth(0), 'after-04-tags1');
  await part(tags.nth(1), 'after-04-tags2');
});

test('5-6: the refund in «Hamyon» (g63/5 phone 6)', async ({ page }) => {
  await openDriver(page, '2026-10-08T12:00', { trips: [], bookings: [], bonus: mockupWallet.bonus });
  await page.route('**/api/driver/wallet', (route) => route.fulfill({ json: mockupWallet }));
  await openWallet(page);
  const refund = page.getByText('Qaytarildi · Akmal kelmadi');
  await expect(refund).toBeVisible();
  await shot(page, 'after-06');
  // «Hamyon» itself is redesigned by G65: the row of the refund alone.
  await part(refund.locator('xpath=ancestor::div[2]'), 'after-06-refund');
});
