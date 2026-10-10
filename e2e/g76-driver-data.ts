import { confirmed } from './bookings-mock';
import { tashkent } from './g63-after-mock';
import { tripOf } from './market-mock';

// The 16 phones of the driver on the mockup g76/3, one to one (lesson 151): Dilnoza with her Cobalt
// in Chilonzor on 7 October at 15:00; her trip leaves tomorrow at 08:00, the day phones (11 … 15)
// stand on a trip of today at 16:00.
export const CHILONZOR = '1726294';
export const SAMARQAND = '1718';
const FARGONA = '1730401';
export const DAY = '2026-10-07T15:00';
export const at = (time: string) => tashkent(`2026-10-${time}`);

const pitak = { id: 'chilonzor', name: 'Chilonzor pitagi', point: { lat: 41.2856, lng: 69.2034 } };

// The trips made this week: «Bu hafta 3 ta safar».
const done = (id: string, day: string) =>
  tripOf(id, 'Dilnoza', true, 0, {
    departAt: at(`${day}T08:00`),
    status: 'completed',
    arrivedAt: at(`${day}T12:00`),
  });
const week = [done('1', '05'), done('2', '06'), done('3', '07')];
const trip = (id: string, when: string, extra: object = {}) => {
  const departAt = at(when);
  return tripOf(id, 'Dilnoza', true, 0, {
    departAt,
    firstDepartAt: departAt,
    seats: 4,
    seatsLeft: 3,
    pitak,
    km: 210,
    ...extra,
  });
};
const tomorrow = trip('4', '08T08:00');
const today = trip('5', '07T16:00', { seatsLeft: 0 });
const seat = (n: string, firstName: string, of: object, extra: object = {}) => ({
  ...confirmed,
  id: `00000000-0000-4000-8000-0000000000${n}`,
  trip: of,
  seats: 1,
  commission: 9000,
  mode: 'pitak',
  pitak,
  passenger: { id: `000000000000000000000000000000${n}`, firstName, hasAvatar: false },
  chatKey: `b00000000-0000-4000-8000-0000000000${n}`,
  ...extra,
});
const asked = (of: object, expiresAt: number) => [
  seat('d1', 'Madina', of, {
    status: 'requested',
    seats: 2,
    commission: 18000,
    confirmedAt: null,
    expiresAt,
  }),
  seat('d2', 'Akmal', of, { status: 'requested', confirmedAt: null, expiresAt }),
];
const riders = (of: object, extra: object = {}) =>
  ['Madina', 'Sardor', 'Akmal'].map((name, n) =>
    seat(`e${n}`, name, of, { status: 'confirmed', ...(n === 0 ? { seats: 2 } : {}), ...extra }),
  );

export type Shot = {
  readonly now: string;
  readonly status?: 'draft' | 'pending' | 'changes_requested' | 'approved';
  readonly welcome?: boolean;
  readonly trips?: readonly object[];
  readonly bookings?: readonly object[];
  readonly wallet?: { readonly bonus: number; readonly main: number; readonly seatsLeft: number };
  readonly recent?: boolean;
  readonly unread?: string;
};
export const plenty = { bonus: 126_000, main: 0, seatsLeft: 14 };

export const DRIVER_SHOTS: Record<number, Shot> = {
  1: { now: DAY, status: 'draft' },
  2: { now: DAY, status: 'pending' },
  3: { now: DAY, status: 'changes_requested' },
  4: { now: DAY, welcome: true, wallet: { bonus: 1_500_000, main: 0, seatsLeft: 166 } },
  5: { now: DAY, trips: week, recent: true },
  6: { now: DAY, trips: [...week, tomorrow], bookings: [seat('c1', 'Sardor', tomorrow)] },
  7: { now: DAY, trips: [...week, tomorrow], bookings: asked(tomorrow, at('07T18:10')) },
  8: {
    now: DAY,
    trips: [...week, tomorrow],
    bookings: asked(tomorrow, at('07T18:10')),
    wallet: { bonus: 0, main: 8000, seatsLeft: 0 },
  },
  9: {
    now: DAY,
    trips: [...week, { ...tomorrow, to: FARGONA }],
    bookings: [
      seat(
        'f1',
        'Madina',
        { ...tomorrow, to: FARGONA },
        {
          seats: 2,
          chatKey: 'o00000000-0000-4000-8000-0000000000f1',
          confirmedAt: at('07T14:50'),
        },
      ),
    ],
  },
  10: { now: DAY, trips: week, wallet: { bonus: 27_000, main: 0, seatsLeft: 3 } },
  11: {
    now: '07T15:20',
    trips: [today, tomorrow],
    bookings: [...riders(today), seat('a1', 'Aziz', tomorrow, { status: 'requested', confirmedAt: null })],
  },
  12: {
    now: '07T15:45',
    trips: [today],
    bookings: riders(today, { cameAt: at('07T15:41') }),
    unread: 'e0',
  },
  13: {
    now: '07T15:58',
    trips: [today],
    bookings: riders(today, { driverCameAt: at('07T15:56'), cameAt: at('07T15:50') }),
  },
  14: {
    now: '07T18:30',
    trips: [{ ...today, departedAt: at('07T16:05') }],
    bookings: riders(today).map((one, n) => ({
      ...one,
      boardedAt: at('07T16:00'),
      arrivedAt: n < 2 ? at('07T18:20') : null,
    })),
  },
  15: { now: '07T17:05', trips: [today], bookings: riders(today) },
  // g76/1: free, no way chosen (the sizes of the phones).
  17: { now: DAY, trips: week },
  16: {
    now: '08T12:00',
    trips: [
      done('1', '05'),
      done('2', '06'),
      { ...today, status: 'completed', departedAt: at('07T16:00'), arrivedAt: at('07T19:30') },
    ],
    bookings: riders({ ...today, status: 'completed' }, { status: 'completed', rated: false }),
  },
};
