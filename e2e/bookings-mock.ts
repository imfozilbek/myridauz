import type { Page, Route } from '@playwright/test';
import { request, tripOf } from './market-mock';

// Bookings, offers and the wallet as the Mini Apps see them (G08).
const HOUR = 3_600_000;
const MINUTE = 60_000;
const DAY = 24 * HOUR;
const TASHKENT_OFFSET = 5 * HOUR;
const trip = tripOf('1', 'Jasur', false, 26);
// The confirmed seat leaves later today in Toshkent: «Mashinaga chiqdim» is there only on the day
// of the trip (docs/89 P7), and late in the evening the hour is the last minute of the day.
const endOfToday = Math.floor((Date.now() + TASHKENT_OFFSET) / DAY) * DAY + DAY - TASHKENT_OFFSET;
const today = tripOf('1', 'Jasur', false, 0, { departAt: Math.min(Date.now() + HOUR, endOfToday - MINUTE) });
const passenger = { id: '0000000000000000000000000000001f', firstName: 'Madina', hasAvatar: false };
const booking = (id: string, status: string, extra: object = {}) => ({
  id: `00000000-0000-4000-8000-0000000000b${id}`,
  trip,
  passenger,
  seats: 2,
  price: 90000,
  commission: 18000,
  status,
  createdAt: Date.now() - HOUR,
  expiresAt: Date.now() + 20 * HOUR,
  mode: 'door',
  pitak: null,
  // Until the confirmation the driver sees the area and the extra way only (docs/70).
  pickup: { point: null, name: null, area: { step: 'mahalla', name: 'Qatortol' } },
  dropoff: { point: null, name: null, area: { step: 'mahalla', name: 'Registon mahallasi' } },
  extraKm: 2,
  plate: null,
  chatKey: `b00000000-0000-4000-8000-0000000000b${id}`,
  confirmedAt: status === 'confirmed' ? Date.now() - HOUR / 2 : null,
  boardedAt: null,
  arrivedAt: null,
  cameAt: null,
  ...extra,
});
export const confirmed = booking('2', 'confirmed', {
  trip: today,
  commission: 0,
  pickup: {
    point: { lat: 41.2856, lng: 69.2034 },
    name: { step: 'landmark', name: 'Chilonzor bozori' },
    area: { step: 'mahalla', name: 'Qatortol' },
  },
  dropoff: {
    point: { lat: 39.6547, lng: 66.9758 },
    name: { step: 'mahalla', name: 'Registon mahallasi' },
    area: { step: 'mahalla', name: 'Registon mahallasi' },
  },
  extraKm: null,
  plate: '01A123BC',
});
export const offer = {
  id: '00000000-0000-4000-8000-0000000000c1',
  requestId: request.id,
  driver: {
    id: '0000000000000000000000000000000b',
    firstName: 'Jasur',
    hasAvatar: false,
    car: trip.driver.car,
    rating: trip.driver.rating,
  },
  from: request.from,
  to: request.to,
  departAt: Date.parse(`${request.date}T03:30:00Z`),
  km: request.km,
  seats: request.seats,
  price: 85000,
  commission: 0,
  status: 'sent',
  bookingId: null,
  chatKey: 'o00000000-0000-4000-8000-0000000000c1',
};
const operation = (
  id: string,
  kind: string,
  amount: number,
  hoursAgo: number,
  reason: string | null = null,
) => ({
  id,
  kind,
  balance: 'bonus',
  amount,
  bookingId: null,
  reason,
  createdAt: Date.now() - hoursAgo * HOUR,
});
const wallet = (bonus: number) => ({
  bonus,
  main: 0,
  bonusExpiresAt: Date.now() + 29 * 24 * HOUR,
  operations:
    bonus === 0 ? [] : [operation('w2', 'commission', -18000, 1), operation('w1', 'bonus_grant', 500000, 30)],
});

export async function mockBookings(page: Page, money = true) {
  const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, json: body });
  const answered: string[] = [];
  await page.route('**/api/trips/*/bookings', (route) => json(route, booking('1', 'requested'), 201));
  await page.route('**/api/passenger/bookings', (route) => json(route, { bookings: [confirmed] }));
  await page.route('**/api/passenger/offers', (route) => json(route, { offers: [offer] }));
  await page.route('**/api/passenger/offers/*/*', (route) =>
    json(route, { ...offer, status: 'accepted', bookingId: confirmed.id }),
  );
  await page.route('**/api/driver/bookings', (route) =>
    json(route, { bookings: [booking('1', 'requested')] }),
  );
  await page.route('**/api/driver/bookings/*/*', (route) => {
    answered.push(route.request().url());
    return money
      ? json(route, { ...booking('1', 'confirmed'), plate: '01A123BC' })
      : json(route, { error: 'wallet.not_enough' }, 402);
  });
  await page.route('**/api/driver/offers', (route) => json(route, { offers: [] }));
  await page.route('**/api/driver/requests/*/offers', (route) => json(route, offer, 201));
  await page.route('**/api/driver/wallet', (route) => json(route, wallet(money ? 482000 : 0)));
  await page.route('**/api/admin/wallets?*', (route) =>
    json(route, {
      wallets: [{ driverId: '0000000000000000000000000000000b', firstName: 'Jasur', bonus: 482000, main: 0 }],
      more: false,
    }),
  );
  await page.route('**/api/admin/wallets/*', (route) => json(route, wallet(482000)));
  await page.route('**/api/admin/wallets/*/adjust', (route) => json(route, wallet(582000)));
  await page.route('**/api/admin/trips/*/bookings', (route) => json(route, { bookings: [confirmed] }));
  return { trip, answered };
}

// A passenger who has no seat yet: the trip offers «Joy band qilish» (one seat request per trip, G52).
export const noSeatYet = (page: Page) =>
  page.route('**/api/passenger/bookings', (route) => route.fulfill({ json: { bookings: [] } }));
