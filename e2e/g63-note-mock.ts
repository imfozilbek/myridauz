import type { Page } from '@playwright/test';
import { DAY_MS, tashkentDate } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { noSeatYet } from './bookings-mock';
import { MAN } from './g59-pixel-mock';
import { mapState, mockMap } from './map-mock';
import { tripOf } from './market-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER] = MINI_APPS;
const CHILONZOR = '1726294';
// The day of the mockup: today 6 October, the trip tomorrow, «7-oktabr».
const NOW = Date.parse('2026-10-06T14:22:00+05:00');

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

// «Qayerdan, qayerga?» of the booking of two seats on the trip of Nodira (G63, g59 journey screen 7).
export async function openBookingPoints(page: Page) {
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
}
