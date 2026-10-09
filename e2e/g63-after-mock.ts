import type { Locator, Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { mapState, mockMap } from './map-mock';
import { request, tripOf } from './market-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';
import { openOwnTrip } from './market';

// The data of the mockups g63/4 (screens 13, 15, 16) and g63/5 (six phones), one to one: Qoʻyliq
// pitagi → Samarqand shahri on 7 October at 08:00, Madina, Akmal and Sardor (lesson 151).
export const { t } = createI18n(DEFAULT_LOCALE);
const [, DRIVER] = MINI_APPS;
const DAY = 24 * 60 * 60 * 1000;
export const tashkent = (time: string) => Date.parse(`${time}+05:00`);
const DEPART = tashkent('2026-10-07T08:00');
// The point of «Grand»: inside the piece of the map of the e2e fixtures (map-mock).
const GRAND = { lat: 41.3113, lng: 69.2795 };

export const mockupTrip = (extra: object = {}) =>
  tripOf('6', 'Jasur', false, 0, {
    departAt: DEPART,
    firstDepartAt: DEPART,
    bookingRule: 'seats_or_car',
    seats: 3,
    seatsLeft: 0,
    status: 'completed',
    ...extra,
  });

type Trip = ReturnType<typeof mockupTrip>;
export const seat = (trip: Trip, n: string, firstName: string, seats: number, extra: object = {}) => ({
  id: `00000000-0000-4000-8000-0000000000e${n}`,
  trip,
  passenger: { id: `000000000000000000000000000000e${n}`, firstName, hasAvatar: false },
  seats,
  wholeCar: false,
  withWoman: false,
  price: trip.price,
  commission: (seats * trip.price) / 10,
  status: 'completed',
  createdAt: DEPART - DAY,
  expiresAt: DEPART,
  mode: 'door',
  pitak: null,
  pickup: {
    point: GRAND,
    name: { step: 'landmark', name: 'Grand' },
    area: { step: 'district', name: 'Chilonzor' },
  },
  dropoff: { point: null, name: null, area: { step: 'district', name: 'Samarqand shahri' } },
  extraKm: null,
  plate: null,
  chatKey: `b00000000-0000-4000-8000-0000000000e${n}`,
  confirmedAt: DEPART - DAY,
  boardedAt: null,
  arrivedAt: null,
  cameAt: null,
  driverCameAt: null,
  metAt: null,
  noShowAt: null,
  refund: null,
  rated: false,
  ...extra,
});

type Driver = {
  readonly trips: readonly object[];
  readonly bookings: readonly object[];
  readonly bonus?: number;
};

// The driver app at the moment of the mockup, with these own trips and bookings.
export async function openDriver(page: Page, now: string, { trips, bookings, bonus = 110000 }: Driver) {
  const { published } = await mockApi(page, 'active');
  published.push(...trips);
  await mockMap(page, mapState());
  await page.route('**/api/driver/bookings', (route) => route.fulfill({ json: { bookings } }));
  await page.route('**/api/driver/wallet', (route) =>
    route.fulfill({ json: { bonus, main: 0, bonusExpiresAt: null, operations: [] } }),
  );
  // Four passengers ask the way back on the next day (mockup g63/4 screen 16).
  await page.route('**/api/driver/requests?*', (route) =>
    route.fulfill({ json: { requests: [1, 2, 3, 4].map((n) => ({ ...request, id: `${request.id}${n}` })) } }),
  );
  await page.route('**/api/reviews', (route) => route.fulfill({ status: 204 }));
  await page.clock.setFixedTime(tashkent(now));
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(DRIVER.port)));
}

// «Mening safarlarim», then the trip of the mockup.
export async function openTrip(page: Page) {
  await page.getByText(t('common.myTrips')).click();
  await openOwnTrip(page);
}

const SHOTS = 'screenshots/pixel-g63';
export const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${SHOTS}/${name}-code.png`, animations: 'disabled' });
// One part of a page that another step draws (C2) or redesigns (G64): the part alone against its
// piece of the mockup.
export const part = (locator: Locator, name: string) =>
  locator.screenshot({ path: `${SHOTS}/${name}-code.png`, animations: 'disabled' });
