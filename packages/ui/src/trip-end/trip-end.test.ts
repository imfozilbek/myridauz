import { loadBrand } from '@platform/brands';
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
  // 320 km at 60 km/h from 08:00 of 7 October: ≈ 13:25 there.
  const there = { ...trip, departAt: Date.parse('2026-10-07T08:00:00+05:00'), arrivedAt: null };
  const RULES = loadBrand().schedule;
  const at = (time: string, day = '2026-10-07') => Date.parse(`${day}T${time}:00+05:00`);
  const back = (arrivedAt: number | null, now: number) => returnDepartAt({ ...there, arrivedAt }, now, RULES);

  it('leaves today after the arrival and two hours of rest, on a slot of 30 minutes (G78 В11)', () => {
    expect(back(null, at('08:00'))).toBe(at('15:30'));
    expect(back(at('12:40'), at('12:45'))).toBe(at('15:00'));
  });

  it('leaves an hour after now at the earliest when the driver comes late', () => {
    expect(back(at('13:25'), at('16:10'))).toBe(at('17:30'));
  });

  it('leaves today at 22:00 the latest, later the next morning; the night is the morning too', () => {
    expect(back(at('19:50'), at('19:55'))).toBe(at('22:00'));
    expect(back(at('20:10'), at('20:15'))).toBe(at('08:00', '2026-10-08'));
    expect(back(at('23:30'), at('23:35'))).toBe(at('08:00', '2026-10-08'));
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
      until: null,
    });
    expect(returnTrip(trip, buildDirectory([]), departAt)).toBeNull();
  });
});
