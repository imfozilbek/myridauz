import { confirmed, offer } from './bookings-mock';
import { tashkent } from './g63-after-mock';
import { request, tripOf } from './market-mock';

// The 15 phones of the passenger on the mockup g76/2, one to one (lesson 151): Madina in Chilonzor
// on 7 October at 15:00; her seat with Jasur leaves tomorrow at 08:00 from Chilonzor pitagi. The
// day phones (9 … 13) stand on 8 October.
export const CHILONZOR = '1726294';
export const SAMARQAND = '1718';
const FARGONA = '1730401';
const DAY = '2026-10-07T15:00';
export const TRIP_DAY = '2026-10-08T07:35';
const DEPART = tashkent('2026-10-08T08:00');
const MINUTE = 60_000;

export const madina = (face: boolean) => ({
  id: '00000000000000000000000000000001',
  firstName: 'Madina',
  gender: 'female',
  phone: '+998901110112',
  roles: ['passenger'],
  // A refused photo asks for a new one in the head (mockup g76/2 phone 1).
  hasAvatar: true,
  writeAccess: true,
  joinedAt: tashkent('2026-08-01T10:00'),
  rating: face ? 4.8 : null,
  avatarStatus: face ? 'approved' : 'rejected',
  avatarReason: null,
});

// 210 km: on the road 3,5 hours, at Samarqand ≈ 11:30 as on the mockup.
export const trip = tripOf('1', 'Jasur', false, 0, { departAt: DEPART, seatsLeft: 0, km: 210 });
// Madina waits at Chilonzor pitagi (mockup g76/2 phones 7 … 10).
// Where to stand, as the team writes it in the admin (G76, docs/72).
const pitak = {
  id: 'chilonzor',
  name: 'Chilonzor pitagi',
  point: { lat: 41.2856, lng: 69.2034 },
  hint: 'Metro 2-chiqish yonida',
};
const seat = (extra: object = {}) => ({
  ...confirmed,
  trip,
  mode: 'pitak',
  pitak,
  createdAt: tashkent('2026-10-07T09:00'),
  confirmedAt: tashkent('2026-10-07T10:00'),
  expiresAt: DEPART,
  ...extra,
});
// A trip of Jasur not shown yet: another id than the one the common mocks mark seen.
export const saved = tripOf('5', 'Jasur', false, 0, { departAt: DEPART, seatsLeft: 1 });
const asked = { ...request, to: FARGONA, date: '2026-10-08', seats: 2 };
const offers = [
  { id: 'c1', name: 'Jasur', hour: '08:00', price: 90000 },
  { id: 'c2', name: 'Akmal', hour: '10:30', price: 85000 },
].map((one) => ({
  ...offer,
  id: `00000000-0000-4000-8000-0000000000${one.id}`,
  requestId: asked.id,
  to: FARGONA,
  driver: { ...offer.driver, firstName: one.name },
  price: one.price,
  departAt: tashkent(`2026-10-08T${one.hour}`),
}));

// «12 ta safar» on «Mening safarlarim»: the trips Madina made, rated, long ago.
export const past = Array.from({ length: 12 }, (_, index) => ({
  ...seat({ status: 'completed', rated: true }),
  id: `00000000-0000-4000-8000-0000000001${String(index).padStart(2, '0')}`,
  trip: tripOf('1', 'Jasur', false, 0, { departAt: tashkent('2026-09-01T08:00') - index * 86_400_000 }),
}));

export type Lists = {
  readonly now: string;
  readonly face?: boolean;
  readonly recent?: boolean;
  readonly bookings?: readonly object[];
  readonly requests?: readonly object[];
  readonly offers?: readonly object[];
  readonly favorite?: boolean;
  // A new rating: «Yangi» in the head (phone 4).
  readonly unrated?: boolean;
  // Unread words of the driver: «1 ta yangi xabar» on «Suhbatlar» (phone 9).
  readonly unread?: boolean;
};

// What each phone of the mockup holds.
export const PASSENGER_SHOTS: Record<number, Lists> = {
  1: { now: DAY, face: false },
  2: { now: DAY, recent: true },
  3: { now: DAY, favorite: true },
  // «14 haydovchi koʻrdi»: the drivers who saw it on their board (G76).
  4: { now: DAY, requests: [{ ...asked, views: 14 }], unrated: true },
  5: { now: DAY, requests: [asked], offers },
  6: {
    now: DAY,
    bookings: [seat({ status: 'requested', confirmedAt: null, expiresAt: tashkent('2026-10-07T20:20') })],
  },
  7: {
    now: DAY,
    // A second seat on 10 October: the block shows the nearest, the tile counts the other.
    bookings: [
      seat(),
      {
        ...seat(),
        id: '00000000-0000-4000-8000-0000000000b9',
        trip: {
          ...trip,
          id: '00000000-0000-4000-8000-000000000009',
          departAt: tashkent('2026-10-10T08:00'),
          firstDepartAt: tashkent('2026-10-10T08:00'),
        },
      },
    ],
  },
  8: { now: DAY, bookings: [seat({ trip: { ...trip, departAt: tashkent('2026-10-08T09:30') } })] },
  // Jasur left for the pitak: «Jasur yoʻlda» without minutes (owner decision 10.10.2026).
  9: {
    now: TRIP_DAY,
    bookings: [seat({ unread: 1, trip: { ...trip, departedAt: tashkent(TRIP_DAY) - 4 * MINUTE } })],
    unread: true,
  },
  10: { now: TRIP_DAY, bookings: [seat({ driverCameAt: tashkent(TRIP_DAY) - 3 * MINUTE })] },
  11: { now: TRIP_DAY, bookings: [seat({ noShowAt: tashkent(TRIP_DAY) })] },
  12: { now: '2026-10-08T09:00', bookings: [seat({ boardedAt: DEPART })] },
  13: { now: '2026-10-08T12:40', bookings: [seat({ boardedAt: DEPART })] },
  14: {
    now: '2026-10-09T12:00',
    bookings: [seat({ status: 'completed', boardedAt: DEPART, arrivedAt: DEPART })],
  },
  15: { now: DAY, bookings: [seat({ status: 'declined', confirmedAt: null })] },
  // g76/1: free, no way chosen (the sizes of the phones).
  16: { now: DAY },
};
