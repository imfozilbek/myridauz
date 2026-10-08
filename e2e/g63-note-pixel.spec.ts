import type { Page } from '@playwright/test';
import { DAY_MS, tashkentDate } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, test } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { noSeatYet } from './bookings-mock';
import { MAN } from './g59-pixel-mock';
import { mapState, mockMap } from './map-mock';
import { tripOf } from './market-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

// Pixel Perfect of «Qayerdan, qayerga?» with the line «Izoh (ixtiyoriy)» (G63, owner decision 8):
// the screen 7 of docs/goals/g59/11-journey-passenger.png at its scale, cut where G59 cut it (360 × 776
// at 1.25, docs/133; owner decision 4), and with its data: the trip of Nodira tomorrow at 16:00 for
// 100 000 a seat, two seats. The line itself is on no mockup: the parts above and below it are
// measured each against its own piece (lesson 160).
const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER] = MINI_APPS;
const OUT = 'screenshots/pixel-g63';
const CHILONZOR = '1726294';
// The day of the mockup: today 6 October, the trip tomorrow, «7-oktabr».
const NOW = Date.parse('2026-10-06T14:22:00+05:00');
test.use({ viewport: { width: 360, height: 776 }, deviceScaleFactor: 1.25 });

async function mockupTrip(page: Page) {
  const tomorrow = tashkentDate(NOW + DAY_MS);
  const nodira = tripOf('2', 'Nodira', true, 0, {
    departAt: Date.parse(`${tomorrow}T16:00:00+05:00`),
    price: 100000,
    seatsLeft: 2,
  });
  await page.route('**/api/trips/directions?*', (route) =>
    route.fulfill({ json: { directions: [{ to: '1718', today: 0, tomorrow: 1, price: 100000 }] } }),
  );
  const days = [0, 1].map((trips, index) => ({ date: tashkentDate(NOW + index * DAY_MS), trips }));
  await page.route('**/api/trips/days?*', (route) => route.fulfill({ json: { km: 300, days } }));
  await page.route('**/api/trips?*', (route) => route.fulfill({ json: { trips: [nodira] } }));
  await page.route('**/api/users/*/reviews', (route) =>
    route.fulfill({ json: { rating: { average: 4.8, count: 23 }, reviews: [] } }),
  );
}

test('«Qayerdan, qayerga?» with «Izoh (ixtiyoriy)» (g59 journey screen 7)', async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await mockApi(page, 'active');
  await mockMap(page, mapState());
  await noSeatYet(page);
  await mockupTrip(page);
  // «Qayerdan» of the mockup: Chilonzor, Toshkent, where the phone stands.
  await page.addInitScript((id) => localStorage.setItem('here_district', id), CHILONZOR);
  await page.route('**/api/passenger/map/where?*', (route) =>
    route.fulfill({ json: { district: CHILONZOR, name: { step: 'landmark', name: 'Grand' }, area: null } }),
  );
  await page.route('**/api/me', (route) => route.fulfill({ json: { state: 'active', profile: MAN } }));
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port), 'android'));
  await page.locator('#tg-main-button', { hasText: TEXT.findTrip }).click();
  await page.locator('.direction-card').first().click();
  await page.getByRole('tab').nth(1).click();
  await page.locator('.search-trip').first().click();
  await expect(page.getByText(t('find.seatsTitle'))).toBeVisible();
  await page.getByLabel(t('market.price.more')).click();
  await page.locator('#tg-main-button', { hasText: t('find.book', { count: '2' }) }).click();
  await expect(page.getByText(t('bookings.points.title'))).toBeVisible();
  await expect(page.getByText(t('bookings.points.note'))).toBeVisible();
  await page.screenshot({ path: `${OUT}/note-code.png`, animations: 'disabled' });
});
