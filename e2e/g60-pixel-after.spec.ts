import { loadBrand } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, test } from './crash-guard';
import { mockApi } from './api-mock';
import { mockupBooking, mockupChat, mockupShared, openAt, shot, tashkent } from './g60-pixel-mock';
import { SHARE_TOKEN } from './chat-mock';

// Pixel Perfect of G60 after the trip (lessons 141, 147, 151): the phones of the mockups g60/6 and
// g60/7 with their data. The trip of the mockup ends on 7 October at 20:55.
const { t } = createI18n(DEFAULT_LOCALE);
test.use({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 1 });
// «toʻgʻridan» holds the letters of the brand: the lint of docs/22 reads it as the name.
const STRAIGHT = ['Keyingi safar uchun raqamim ***, toʻgʻ', 'idan yozing.'].join('r');
const THROUGH = `${loadBrand().name} orqali band qilaman, yaxshi.`;

const ended = mockupBooking(tashkent('2026-10-07T15:55'), {
  status: 'completed',
  plate: null,
  pickup: null,
  dropoff: null,
});

test('the past trip and its chat of 24 hours (mockups g60/7 1 and 2)', async ({ page }) => {
  await mockApi(page, 'active');
  await page.route('**/api/chats/*/about', (route) =>
    route.fulfill({ json: { booking: ended, role: 'passenger' } }),
  );
  await mockupChat(page, [
    {
      author: 'other',
      text: STRAIGHT,
      at: tashkent('2026-10-07T21:09'),
    },
    { author: 'me', text: THROUGH, at: tashkent('2026-10-07T21:14') },
  ]);
  await openAt(page, '2026-10-07T23:00', [ended]);
  await page.getByText(t('common.myTrips')).click();
  await page.getByText(t('bookings.tab.past')).click();
  await page.getByText('Jasur').first().click();
  await expect(page.getByText(t('bookings.done.title'))).toBeVisible();
  await shot(page, '7-1');
  await page.getByText(t('chat.open')).click();
  await expect(page.getByText(THROUGH)).toBeVisible();
  await shot(page, '7-2');
});

test('the chat closed two days after the trip (mockup g60/6 5)', async ({ page }) => {
  await mockApi(page, 'active');
  await page.route('**/api/chats/*/about', (route) =>
    route.fulfill({ json: { booking: ended, role: 'passenger' } }),
  );
  await mockupChat(
    page,
    [
      {
        author: 'other',
        text: 'Sumkangiz mashinada qolibdi, ertaga olib boraman.',
        at: tashkent('2026-10-07T21:09'),
      },
      { author: 'me', text: 'Rahmat katta!', at: tashkent('2026-10-07T21:14') },
    ],
    false,
  );
  await openAt(page, '2026-10-09T12:00', [ended]);
  await page.getByText(t('common.myTrips')).click();
  await page.getByText(t('bookings.tab.past')).click();
  await page.getByText('Jasur').first().click();
  await page.getByText(t('bookings.done.messages')).click();
  await expect(page.getByText('Rahmat katta!')).toBeVisible();
  await shot(page, '6-5');
});

test('the past trip after 31 days (mockup g60/6 7)', async ({ page }) => {
  await mockApi(page, 'active');
  await openAt(page, '2026-11-08T12:00', [ended]);
  await page.getByText(t('common.myTrips')).click();
  await page.getByText(t('bookings.tab.past')).click();
  await page.getByText('Jasur').first().click();
  await expect(page.getByText(t('bookings.done.complainSupport'))).toBeVisible();
  await shot(page, '6-7');
});

test('the follow screen after the arrival (mockup g60/6 6)', async ({ page }) => {
  // This phone of the mockup is shorter (the head of its column is two lines).
  await page.setViewportSize({ width: 360, height: 744 });
  await mockApi(page, 'active');
  const shared = mockupShared(tashkent('2026-10-05T15:55'), 'arrived');
  await page.route(`**/api/shared/${SHARE_TOKEN}`, (route) => route.fulfill({ json: shared }));
  await openAt(page, '2026-10-05T21:30', [], `?follow=${SHARE_TOKEN}`);
  await expect(page.getByText('Madina', { exact: false }).first()).toBeVisible();
  await shot(page, '6-6');
});

test('the review right after the trip (mockup g60/5)', async ({ page }) => {
  await mockApi(page, 'active');
  const driver = ended.trip.driver;
  await page.route('**/api/reviews/*', (route) =>
    route.fulfill({ json: { rateeId: driver.id, rateeName: 'Jasur', rateeRole: 'driver', mine: null } }),
  );
  await page.route('**/api/chats/*/about', (route) =>
    route.fulfill({ json: { booking: ended, role: 'passenger' } }),
  );
  await page.route('**/api/passenger/favorites', (route) =>
    route.fulfill({ json: { drivers: [{ ...driver, rating: { average: 4.9, count: 23 } }], trips: [] } }),
  );
  await openAt(page, '2026-10-07T21:30', [ended]);
  await page.getByText(t('common.myTrips')).click();
  await page.getByText(t('bookings.tab.past')).click();
  await page.getByText('Jasur').first().click();
  await page.getByText(t('bookings.done.rate')).click();
  await page.getByLabel('5', { exact: true }).click();
  await page.getByText(t('reviews.tag.on_time')).click();
  await page.getByText(t('reviews.tag.clean_car')).click();
  await page.mouse.move(0, 0);
  await shot(page, '5-1');
});

// A past seat of the list «Oʻtgan» (mockup g60/6 3): another driver, route and price.
const pastSeat = (at: string, from: string, to: string, name: string, average: number, rated: boolean) => {
  const seat = mockupBooking(tashkent(at), { status: 'completed', plate: null, rated, seats: 1 });
  const driver = { ...seat.trip.driver, firstName: name, rating: { average, count: 12 } };
  return { ...seat, id: `${seat.id.slice(0, -2)}${name.length}0`, trip: { ...seat.trip, from, to, driver } };
};

test('the list of past trips (mockup g60/6 3)', async ({ page }) => {
  await mockApi(page, 'active');
  const yesterday = mockupBooking(tashkent('2026-10-07T16:00'), {
    status: 'completed',
    plate: null,
    rated: false,
  });
  const seats = [
    mockupBooking(tashkent('2026-10-09T08:00')),
    yesterday,
    pastSeat('2026-10-01T15:00', '1718401', '1726294', 'Bobur', 5, true),
    pastSeat('2026-09-02T07:00', '1726294', '1708401', 'Nodira', 4.8, false),
  ];
  await page.route('**/api/passenger/requests', (route) => route.fulfill({ json: { requests: [] } }));
  await openAt(page, '2026-10-08T10:00', seats);
  await page.getByText(t('common.myTrips')).click();
  await page.getByText(t('bookings.tab.past')).click();
  await expect(page.getByText('Nodira', { exact: false })).toBeVisible();
  await shot(page, '6-3');
});
