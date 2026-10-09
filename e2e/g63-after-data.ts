import { mockupTrip, seat, tashkent } from './g63-after-mock';

// The people and the trips of each phone of the mockups g63/4 and g63/5 (lesson 151).
export const live = mockupTrip({ status: 'full' });
export const madina = (extra: object = {}) => seat(live, '1', 'Madina', 2, { status: 'confirmed', ...extra });
export const akmal = (extra: object = {}) =>
  seat(live, '2', 'Akmal', 1, {
    status: 'confirmed',
    mode: 'pitak',
    pitak: live.pitak,
    pickup: null,
    ...extra,
  });
const NO_SHOW = { noShowAt: tashkent('2026-10-07T08:10'), refund: { state: 'proposed', amount: 9000 } };

// Phone 5: Madina rated with five stars, Akmal did not come and his refund waits; «Yetib keldik» at
// 12:55, before the ≈ 13:00 of the road.
export const pastTrip = mockupTrip({ arrivedAt: tashkent('2026-10-07T12:55') });
export const pastSeats = [
  seat(pastTrip, '1', 'Madina', 2, { rated: true }),
  seat(pastTrip, '2', 'Akmal', 1, NO_SHOW),
];
export const fiveStars = {
  rateeId: '000000000000000000000000000000e1',
  rateeName: 'Madina',
  rateeRole: 'passenger',
  mine: { stars: 5, tags: [], text: '' },
};

// Phone 4: yesterday's trip with the stars to give and the refund, the trip of 1 October all rated,
// one trip ahead.
const back = mockupTrip({
  id: '00000000-0000-4000-8000-0000000000f6',
  from: pastTrip.to,
  to: pastTrip.from,
  departAt: tashkent('2026-10-01T15:00'),
  pitak: null,
});
const ahead = mockupTrip({
  id: '00000000-0000-4000-8000-0000000000f7',
  departAt: tashkent('2026-10-09T15:00'),
  status: 'active',
  seatsLeft: 3,
});
export const pastList = {
  trips: [ahead, pastTrip, back],
  bookings: [
    seat(pastTrip, '1', 'Madina', 2),
    seat(pastTrip, '2', 'Akmal', 1, NO_SHOW),
    seat(back, '4', 'Bobur', 2, { rated: true }),
  ],
};

// Phone 6: the refund the owner confirmed today, the commissions and the start bonus.
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
export const mockupWallet = {
  bonus: 473000,
  main: 0,
  bonusExpiresAt: tashkent('2026-11-04T00:00'),
  seatsLeft: 52,
  operations: [
    op('w4', 'admin_adjustment', 9000, '2026-10-08T11:00', {
      bookingId: 'e2',
      reason: 'no_show',
      passenger: 'Akmal',
    }),
    op('w3', 'commission', -18000, '2026-10-08T09:00'),
    op('w2', 'commission', -9000, '2026-10-05T09:00'),
    op('w1', 'bonus_grant', 500000, '2026-10-05T08:00'),
  ],
};
