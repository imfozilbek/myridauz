import type { Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { PITAK, tripOf } from './market-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';
import { openOwnTrip } from './market';

// The data of the mockup g63/3 (3-trip.png), one to one: Qoʻyliq pitagi → Samarqand shahri tomorrow
// at 08:00, 90 000 a seat, «Joylar yoki salon»; Madina asks 2 seats, Akmal 1 (lesson 151).
const { t } = createI18n(DEFAULT_LOCALE);
const [, DRIVER] = MINI_APPS;
const tashkent = (time: string) => Date.parse(`${time}+05:00`);
const DEPART = '2026-10-07T08:00';
const RATING = { average: 4.8, count: 12 };

// The moment of the mockup beside the time: «Yoʻlga chiqdim» tapped (phone 3, journey screen 14),
// Akmal did not come (g63/5 phone 1), the trip in the channel (g59/7-channels-3 phone 1).
export type Moment = {
  readonly departed?: boolean;
  readonly noShow?: boolean;
  readonly publicity?: object;
  // The two points of «Safar xaritasi» (journey screen 12): Madina near Grand, Sardor at his pitak.
  readonly stops?: boolean;
};

const trip = (full: boolean, moment: Moment = {}) =>
  tripOf('7', 'Jasur', false, 0, {
    departAt: tashkent(DEPART),
    firstDepartAt: tashkent(DEPART),
    bookingRule: 'seats_or_car',
    seatsLeft: full ? 0 : 3,
    status: full ? 'full' : 'active',
    departedAt: moment.departed ? tashkent('2026-10-07T08:00') : null,
  });

const person = (id: string, firstName: string) => ({ id, firstName, hasAvatar: false, rating: RATING });
const seat = (full: boolean, id: string, extra: object) => ({
  id: `00000000-0000-4000-8000-0000000000d${id}`,
  trip: trip(full),
  wholeCar: false,
  withWoman: false,
  price: 90000,
  status: full ? 'confirmed' : 'requested',
  createdAt: tashkent('2026-10-06T13:00'),
  expiresAt: tashkent('2026-10-07T08:00'),
  dropoff: { point: null, name: null, area: { step: 'district', name: 'Samarqand shahri' } },
  plate: null,
  chatKey: `b00000000-0000-4000-8000-0000000000d${id}`,
  confirmedAt: full ? tashkent('2026-10-06T14:00') : null,
  boardedAt: null,
  arrivedAt: null,
  cameAt: null,
  ...extra,
});

// Akmal did not come to the pitak: the driver was there at 07:40, the refund waits for the team.
const noShow = { driverCameAt: tashkent('2026-10-07T07:40'), noShowAt: tashkent('2026-10-07T07:45') };

// Madina from her door near Chilonzor bozori (+2 km), Akmal from the pitak.
const SOBIR = { id: 'sobir', name: 'Sobir Rahimov avtostansiyasi', point: { lat: 41.2795, lng: 69.2042 } };
const GRAND = {
  point: { lat: 41.2856, lng: 69.2034 },
  name: { step: 'landmark', name: 'Grand' },
  area: null,
};
const stops = () => [
  seat(true, '1', {
    passenger: person('0000000000000000000000000000001f', 'Madina'),
    seats: 2,
    commission: 18000,
    mode: 'door',
    pitak: null,
    pickup: GRAND,
    extraKm: null,
  }),
  seat(true, '3', {
    passenger: person('0000000000000000000000000000003f', 'Sardor'),
    seats: 1,
    commission: 9000,
    mode: 'pitak',
    pitak: SOBIR,
    pickup: null,
    extraKm: null,
  }),
];
const seats = (full: boolean, moment: Moment) => [
  seat(full, '1', {
    passenger: person('0000000000000000000000000000001f', 'Madina'),
    seats: 2,
    commission: 18000,
    mode: 'door',
    pitak: null,
    pickup: { point: null, name: null, area: { step: 'mahalla', name: 'Chilonzor bozori' } },
    extraKm: 2,
  }),
  seat(full, '2', {
    passenger: person('0000000000000000000000000000002f', 'Akmal'),
    seats: 1,
    commission: 9000,
    mode: 'pitak',
    pitak: PITAK,
    pickup: null,
    extraKm: full ? null : 0,
    ...(moment.noShow ? noShow : {}),
  }),
];

// «Mening safarim» at a moment of the mockup: after the publishing (requests), or with the full car.
// Without the publicity the card of the channel stays away, as on an error (g63/3 is older than it).
export async function openTripAt(page: Page, now: string, full: boolean, moment: Moment = {}) {
  const { published } = await mockApi(page, 'active');
  published.push(trip(full, moment));
  await page.route('**/api/driver/bookings', (route) =>
    route.fulfill({ json: { bookings: moment.stops ? stops() : seats(full, moment) } }),
  );
  const { publicity } = moment;
  if (publicity)
    await page.route('**/api/driver/trips/*/publicity', (route) => route.fulfill({ json: publicity }));
  await page.clock.setFixedTime(tashkent(now));
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(DRIVER.port)));
  await page.getByText(t('common.myTrips')).click();
  await openOwnTrip(page);
  await page.getByText(t('driverTrip.tile.map')).waitFor();
}
