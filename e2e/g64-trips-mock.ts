import type { Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { confirmed } from './bookings-mock';
import { sardor, tashkent } from './g64-requests-mock';
import { tripOf } from './market-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

// «Mening safarlarim» of the mockup g64/6 with one live trip (owner decision 12.10.2026, docs/172
// sheet 1, 9): today is 7 October, the trip at 16:00 has a new request; yesterday's trip at 08:00 is
// over. The private trip of g64/3 phone 3 waits for Sardor.
const { t } = createI18n(DEFAULT_LOCALE);
const [, DRIVER] = MINI_APPS;
const at = (day: string, time: string) => tashkent(`2026-10-${day}T${time}`);
const trips = [
  tripOf('1', 'Jasur', false, 0, { departAt: at('07', '16:00'), seats: 4, seatsLeft: 3 }),
  tripOf('4', 'Jasur', false, 0, {
    departAt: at('06', '08:00'),
    status: 'completed',
    arrivedAt: at('06', '13:00'),
  }),
];
const [first] = trips;
const asked = { ...confirmed, id: '00000000-0000-4000-8000-0000000000b9', trip: first, status: 'requested' };

const json = (page: Page, path: string, body: object) =>
  page.route(path, (route) => route.fulfill({ json: body }));

async function openTrips(page: Page, shown: readonly object[], offers: readonly object[]) {
  await mockApi(page, 'active');
  await json(page, '**/api/driver/trips', { trips: shown });
  await json(page, '**/api/driver/trips/month', { trips: 8, costs: 2_150_000 });
  await json(page, '**/api/driver/bookings', { bookings: shown === trips ? [asked] : [] });
  await json(page, '**/api/driver/offers', { offers });
  await page.clock.setFixedTime(at('07', '12:20'));
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(DRIVER.port)));
  await page.getByText(t('common.myTrips')).first().click();
}

// The list of the mockup: g64/6 phone 1, or phone 2 after a tap on «Pa 8».
export async function openMyTrips(page: Page, day?: string) {
  await openTrips(page, trips, []);
  await page.locator('.driver-trip').first().waitFor();
  if (day) await page.locator('.week-day', { hasText: day }).click();
}

// «Mening safarim» of the trip opened for Sardor's whole car (g64/3 phone 3): waiting for him.
export async function openPrivateTrip(page: Page) {
  const request = sardor('2026-10-08');
  const hidden = tripOf('5', 'Jasur', false, 0, {
    departAt: at('08', '08:00'),
    seats: 4,
    seatsLeft: 4,
    private: true,
    bookingRule: 'car_only',
  });
  const offer = {
    id: '00000000-0000-4000-8000-0000000000c5',
    requestId: request.id,
    tripId: hidden.id,
    status: 'sent',
    passenger: { id: '00000000000000000000000000000008', firstName: 'Sardor', hasAvatar: false },
  };
  await openTrips(
    page,
    [hidden],
    [
      {
        ...offer,
        driver: hidden.driver,
        from: hidden.from,
        to: hidden.to,
        departAt: hidden.departAt,
        km: hidden.km,
        seats: 4,
        wholeCar: true,
        price: 90000,
        commission: 0,
        bookingId: null,
        chatKey: 'o1',
        pitak: 'Qoʻyliq pitagi',
        createdAt: 0,
      },
    ],
  );
  await page.locator('.driver-trip').first().click();
  await page.getByText('Sardorga taklif yuborildi').waitFor();
}
