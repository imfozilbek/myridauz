import type { Page } from '@playwright/test';
import { tashkentDate } from '@platform/contracts';
import { confirmed, offer } from './bookings-mock';
import { request, tripOf } from './market-mock';
import { TEST_NOW } from './test-clock';

// The lists of the mockup g75/2 A (G75): a seat tomorrow at 08:00 Chilonzor → Samarqand with Jasur, a
// request to Buxoro with 2 offers, an old one to Navoiy; three routes followed in «Obunalar».
const DAY = 86_400_000;
const day = (days: number) => tashkentDate(TEST_NOW + days * DAY);
const tomorrow8 = Date.parse(`${day(1)}T03:00:00Z`);
const seat = { ...confirmed, trip: tripOf('1', 'Jasur', false, 0, { departAt: tomorrow8 }) };
const TOSHKENT = '1726';
const toBuxoro = { ...request, id: 'r-buxoro', from: TOSHKENT, to: '1706401', date: day(2), seats: 2 };
const toNavoiy = {
  ...request,
  id: 'r-navoiy',
  from: TOSHKENT,
  to: '1712401',
  date: day(-1),
  seats: 1,
  status: 'expired',
};
const offerOn = (id: string) => ({ ...offer, id, requestId: toBuxoro.id });

const subscription = (id: string, from: string, to: string, extra: object) => ({
  id,
  kind: 'trips',
  from,
  to,
  date: null,
  woman: false,
  expiresAt: TEST_NOW + 32 * DAY,
  expired: false,
  ...extra,
});

export async function mockLists(page: Page, empty = false) {
  const json = (path: string, body: unknown) => page.route(path, (route) => route.fulfill({ json: body }));
  await json('**/api/passenger/bookings', { bookings: empty ? [] : [seat] });
  await json('**/api/passenger/requests', { requests: empty ? [] : [toBuxoro, toNavoiy] });
  await json('**/api/passenger/offers', { offers: empty ? [] : [offerOn('o1'), offerOn('o2')] });
  await json('**/api/passenger/subscriptions', {
    subscriptions: [
      subscription('s1', TOSHKENT, '1718401', {}),
      subscription('s2', '1726294', '1718236', { date: day(2) }),
      subscription('s3', TOSHKENT, '1706401', { expired: true }),
    ],
  });
}
