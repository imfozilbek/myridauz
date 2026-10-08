import { tashkentDayStart } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { akmal, madina } from '../meeting/meet-test-kit';
import { buildDirectory } from '../places/directory';
import { returnDepartAt, returnTrip } from './return-plan';
import { ridersOf, tripSums } from './trip-sums';

const HOUR = 60 * 60 * 1000;
const done = { ...madina, status: 'completed' as const };
const noShow = { ...akmal, noShowAt: 1 };

describe('the trip in numbers (mockups g63/4 screen 15, g63/5 phone 5)', () => {
  it('counts who rode and charges every seat taken', () => {
    const asked = { ...madina, id: 'r1', status: 'requested' as const };
    expect(ridersOf([done, noShow, asked])).toEqual([done]);
    expect(tripSums([done, noShow, asked])).toEqual({
      passengers: 2,
      costs: 190000,
      charged: 19000 + 9500,
      waits: 9500,
      refunded: 0,
    });
    const back = { ...noShow, refund: { state: 'confirmed' as const, amount: 9500 } };
    expect(tripSums([done, back])).toMatchObject({ waits: 0, refunded: 9500 });
  });
});

describe('the way back (mockup g63/4 screen 16)', () => {
  const { trip } = madina;
  it('leaves the next day after the arrival and the rest, on a slot of 30 minutes', () => {
    // 320 km at 60 km/h from 08:00: ≈ 13:25, then two hours of rest: 15:30.
    const at = returnDepartAt({ ...trip, departAt: Date.parse('2026-10-07T08:00:00+05:00') }, '2026-10-08');
    expect(at).toBe(tashkentDayStart('2026-10-08') + 15.5 * HOUR);
  });

  it('turns the route and keeps the seats, the price and the rules', () => {
    const directory = buildDirectory([
      {
        id: trip.from,
        parentId: null,
        type: 'district',
        name: 'Chilonzor',
        lat: 41,
        lng: 69,
        oneCity: false,
      },
      { id: trip.to, parentId: null, type: 'district', name: 'Fargʻona', lat: 40, lng: 71, oneCity: false },
    ]);
    const departAt = tashkentDayStart('2026-10-03') + 15 * HOUR;
    const back = returnTrip({ ...trip, woman: true, comment: 'Konditsioner bor' }, directory, departAt);
    expect(back?.route.from.id).toBe(trip.to);
    expect(back?.route.to.id).toBe(trip.from);
    // The one screen takes the answers as they are: no time of its own beside the day and the time.
    // «Mashinada ayol bor» is never carried: trip.woman also means a woman passenger rode, and a
    // false «ayol bor» misleads women (docs/06); the driver turns it on again on the one screen.
    expect(back?.again).toEqual({
      pickupMode: trip.pickupMode,
      seats: 3,
      price: 95000,
      womanOnBoard: false,
      bookingRule: trip.bookingRule,
      comment: '',
      date: '2026-10-03',
      time: '15:00',
    });
    expect(returnTrip(trip, buildDirectory([]), departAt)).toBeNull();
  });
});
