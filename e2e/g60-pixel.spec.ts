import type { Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, test } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { confirmed } from './bookings-mock';
import { SHARE_TOKEN } from './chat-mock';
import { mockTelegram, pressBack, telegramUrl } from './telegram-mock';

// Pixel Perfect of G60 (lessons 141, 147): the screens of path 3 at the size of the phones of the
// mockups (docs/goals/g60/*.png, 360 wide); the diff is read from the pictures (scripts/pixel-diff.py).
const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER] = MINI_APPS;
const OUT = 'screenshots/pixel-g60';
const HOUR = 3_600_000;
test.use({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 1 });

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });

async function openBooking(page: Page) {
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await page.getByText(t('common.myTrips')).click();
  await page.getByText('Jasur').first().click();
}

test('the booking page and the chat (mockups g60/1, g60/2)', async ({ page }) => {
  await mockApi(page, 'active');
  await openBooking(page);
  await expect(page.getByText(t('bookings.toClose'))).toBeVisible();
  await shot(page, '1-booking');
  await page.getByText(t('chat.open')).click();
  await expect(page.getByText(t('chat.reply.onWay'))).toBeVisible();
  await shot(page, '2-chat');
  await pressBack(page);
});

test('the screen of the close people (mockup g60/3)', async ({ page }) => {
  await mockApi(page, 'active');
  // The state of the mockup: on the way.
  const departAt = Date.now() - 2 * HOUR;
  await page.route(`**/api/shared/${SHARE_TOKEN}`, (route) =>
    route.fulfill({
      json: {
        passengerName: 'Madina',
        from: '1726294',
        to: '1718401',
        departAt,
        firstDepartAt: departAt,
        km: 300,
        driver: { firstName: 'Jasur', car: { make: 'Chevrolet', model: 'Cobalt', color: 'white' } },
        plate: '01A123BC',
        meetingPoint: { lat: 41.2856, lng: 69.2034 },
        dropoffPoint: { lat: 39.6547, lng: 66.9758 },
        status: 'on_the_way',
        followers: 1,
      },
    }),
  );
  await mockTelegram(page);
  await page.goto(telegramUrl(`${appUrl(PASSENGER.port)}?follow=${SHARE_TOKEN}`));
  await expect(page.getByText(t('share.follow.subscribe'))).toBeVisible();
  await shot(page, '3-follow');
});

test('a past trip (mockup g60/7)', async ({ page }) => {
  await mockApi(page, 'active');
  const arrival = Date.now() - HOUR;
  const trip = { ...confirmed.trip, departAt: arrival - 5 * HOUR, firstDepartAt: arrival - 5 * HOUR };
  const done = { ...confirmed, trip, status: 'completed', plate: null, rated: false };
  await page.route('**/api/passenger/bookings', (route) => route.fulfill({ json: { bookings: [done] } }));
  // «Baho berish» of this seat (mockup g60/5): the driver to rate and the trip card.
  await page.route(`**/api/reviews/${done.id}`, (route) =>
    route.fulfill({
      json: { rateeId: done.trip.driver.id, rateeName: 'Jasur', rateeRole: 'driver', mine: null },
    }),
  );
  await page.route('**/api/chats/*/about', (route) =>
    route.fulfill({ json: { booking: done, role: 'passenger' } }),
  );
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await page.getByText(t('common.myTrips')).click();
  await page.getByText(t('bookings.tab.past')).click();
  await shot(page, '6-past-list');
  await page
    .getByText(/^Jasur/u)
    .first()
    .click();
  await expect(page.getByText(t('bookings.done.title'))).toBeVisible();
  await shot(page, '7-past-trip');
  await page.getByText(t('bookings.done.rate')).click();
  await expect(page.getByText(t('reviews.howWas'))).toBeVisible();
  await shot(page, '5-review');
});
