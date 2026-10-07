import { DAY_MS } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { lowerPrice, priceNoticeDue, retime } from './trip-change';
import { endsAt, type TripRecord } from './trip';

const MINUTE = 60 * 1000;
// 2026-10-02 08:00 in Tashkent.
const DEPART = Date.parse('2026-10-02T03:00:00Z');
const NOW = DEPART - 5 * 60 * MINUTE;
const DRIVER = 7;
const trip: TripRecord = {
  id: 't1',
  driverId: DRIVER,
  from: '1726269',
  to: '1718401',
  departAt: DEPART,
  endsAt: endsAt(DEPART, 300),
  km: 300,
  seats: 3,
  price: 90000,
  bookingRule: 'seats',
  womanOnBoard: false,
  comment: '',
  car: null,
  status: 'active',
  pickupMode: 'both',
  createdAt: NOW,
  firstDepartAt: DEPART,
  firstPrice: 90000,
  priceToldAt: null,
};

describe('the time of a trip (G39, docs/104, 8)', () => {
  it('moves only later, up to +1 hour from the first time in all, and the end moves along', () => {
    const later = retime(trip, DRIVER, DEPART + 40 * MINUTE, NOW);
    expect(later).toMatchObject({ departAt: DEPART + 40 * MINUTE, endsAt: trip.endsAt + 40 * MINUTE });
    if (typeof later === 'string') return;
    expect(retime(later, DRIVER, DEPART + 60 * MINUTE, NOW)).toMatchObject({
      departAt: DEPART + 60 * MINUTE,
    });
    // The hour is counted from the first time, not from the last change.
    expect(retime(later, DRIVER, DEPART + 70 * MINUTE, NOW)).toBe('trips.invalid_input');
    expect(retime(later, DRIVER, DEPART + 20 * MINUTE, NOW)).toBe('trips.invalid_input');
  });

  it('keeps the day, and only the driver changes a trip that has not left', () => {
    const late = {
      ...trip,
      departAt: Date.parse('2026-10-02T18:30:00Z'),
      firstDepartAt: Date.parse('2026-10-02T18:30:00Z'),
    };
    // 23:30 + 40 minutes is the next day in Tashkent.
    expect(retime(late, DRIVER, late.departAt + 40 * MINUTE, NOW)).toBe('trips.invalid_input');
    expect(retime(trip, 8, DEPART + 10 * MINUTE, NOW)).toBe('trips.not_found');
    expect(retime({ ...trip, status: 'cancelled' }, DRIVER, DEPART + 10 * MINUTE, NOW)).toBe(
      'trips.wrong_status',
    );
    expect(retime(trip, DRIVER, DEPART + 10 * MINUTE, DEPART + MINUTE)).toBe('trips.wrong_status');
  });
});

describe('the price of a trip (G39, docs/104, 9)', () => {
  it('goes only down, not below the bound of the route', () => {
    expect(lowerPrice(trip, DRIVER, 80000, 30000, NOW)).toMatchObject({ price: 80000, firstPrice: 90000 });
    expect(lowerPrice(trip, DRIVER, 95000, 30000, NOW)).toBe('trips.invalid_input');
    expect(lowerPrice(trip, DRIVER, 90000, 30000, NOW)).toBe('trips.invalid_input');
    expect(lowerPrice(trip, DRIVER, 20000, 30000, NOW)).toBe('trips.price_out_of_bounds');
    expect(lowerPrice(trip, 8, 80000, 30000, NOW)).toBe('trips.not_found');
  });

  it('tells about a lower price at most once a day', () => {
    expect(priceNoticeDue(trip, NOW)).toBe(true);
    const told = { ...trip, priceToldAt: NOW };
    expect(priceNoticeDue(told, NOW + DAY_MS - MINUTE)).toBe(false);
    expect(priceNoticeDue(told, NOW + DAY_MS)).toBe(true);
  });
});
