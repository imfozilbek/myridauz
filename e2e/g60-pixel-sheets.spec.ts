import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, test } from './crash-guard';
import { mockApi } from './api-mock';
import { mockupBooking, openAt, shot, tashkent } from './g60-pixel-mock';

// Pixel Perfect of the two sheets of the home screen (lessons 141, 147, 151): «Yetib keldingizmi?»
// (mockup g60/6 1) and «Sevimli haydovchi» (mockup g60/7 3), on the taller phones of the mockups.
const { t } = createI18n(DEFAULT_LOCALE);
test.use({ viewport: { width: 360, height: 807 }, deviceScaleFactor: 1 });

const noRequests = { json: { requests: [] } };

test('«Yetib keldingizmi?» an hour after the arrival (mockup g60/6 1)', async ({ page }) => {
  await mockApi(page, 'active');
  await page.route('**/api/passenger/requests', (route) => route.fulfill(noRequests));
  const seat = mockupBooking(tashkent('2026-10-08T08:00'));
  await openAt(page, '2026-10-08T14:30', [seat]);
  await expect(page.getByText(t('bookings.arrivedAsk.title'))).toBeVisible();
  await page.waitForTimeout(400);
  await shot(page, '6-1');
});

test('a saved driver has a new trip (mockup g60/7 3)', async ({ page }) => {
  await mockApi(page, 'active');
  await page.route('**/api/passenger/requests', (route) => route.fulfill(noRequests));
  const done = (at: string) => mockupBooking(tashkent(at), { status: 'completed', plate: null });
  const rides = [
    done('2026-09-20T08:00'),
    { ...done('2026-10-01T08:00'), id: 'b0000000-0000-4000-8000-0000000000c9' },
  ];
  const trip = {
    ...done('2026-09-20T08:00').trip,
    id: '00000000-0000-4000-8000-0000000000f7',
    departAt: tashkent('2026-10-09T08:00'),
  };
  await page.route('**/api/passenger/favorites', (route) =>
    route.fulfill({ json: { drivers: [trip.driver], trips: [{ ...trip, seatsLeft: 2, status: 'active' }] } }),
  );
  await openAt(page, '2026-10-08T10:00', rides);
  await expect(page.getByText(t('bookings.favorite.book'))).toBeVisible();
  await page.waitForTimeout(400);
  await shot(page, '7-3');
});
