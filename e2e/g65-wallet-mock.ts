import type { Page } from '@playwright/test';
import { openWallet } from './bookings';
import { mockupTrip, openDriver, seat, tashkent } from './g63-after-mock';
import { PITAK } from './market-mock';

// «Hamyon» of the mockups g65/1 and g65/2, one to one (lesson 151): today is 7 October; Sardor's two
// seats were confirmed today at 14:32 from the bonus, Madina's seat on 5 October, the start bonus too.
const op = (id: string, kind: string, amount: number, at: string, extra: object = {}) => ({
  id,
  kind,
  balance: 'bonus',
  amount,
  bookingId: null,
  reason: null,
  createdAt: tashkent(at),
  ...extra,
});

// Tomorrow at 08:00 from Qoʻyliq pitagi to Samarqand shahri (mockup g65/2 phone 2).
const trip = mockupTrip({ departAt: tashkent('2026-10-08T08:00'), status: 'full', seatsLeft: 0 });
const sardor = seat(trip, '3', 'Sardor', 2, {
  status: 'confirmed',
  mode: 'pitak',
  pitak: PITAK,
  pickup: null,
});
const madina = seat(trip, '1', 'Madina', 1, { status: 'confirmed' });

const walletOf = (bonus: number, seatsLeft: number) => ({
  bonus,
  main: 0,
  bonusExpiresAt: tashkent('2026-11-04T00:00'),
  seatsLeft,
  operations: [
    op('w3', 'commission', -18000, '2026-10-07T14:32', {
      bookingId: sardor.id,
      passenger: 'Sardor',
      seats: 2,
    }),
    op('w2', 'commission', -9000, '2026-10-05T09:00', {
      bookingId: madina.id,
      passenger: 'Madina',
      seats: 1,
    }),
    op('w1', 'bonus_grant', 500000, '2026-10-05T08:00'),
  ],
});

const detail = {
  kind: 'commission',
  amount: -18000,
  balances: ['bonus'],
  createdAt: tashkent('2026-10-07T14:32'),
  booking: sardor,
};

// Phone 1 of g65/1: 473 000 for ≈ 52 seats; phone 2: 36 000 for ≈ 4 seats, red.
export async function openMockupWallet(page: Page, low = false) {
  const [bonus, seatsLeft] = low ? [36000, 4] : [473000, 52];
  await openDriver(page, '2026-10-07T15:00', { trips: [], bookings: [], bonus });
  await page.route('**/api/driver/wallet', (route) => route.fulfill({ json: walletOf(bonus, seatsLeft) }));
  await page.route('**/api/driver/wallet/*', (route) => route.fulfill({ json: detail }));
  await openWallet(page);
}
