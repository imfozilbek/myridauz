import type { Booking, Trip } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { booking } from '../bookings/booking-test-kit';
import { trip } from '../market/market-test-kit';
import { againOf, lastTrip, nextBookings, nextTrips } from './home-items';

const HOUR = 3_600_000;
const tripAt = (id: string, hours: number, status: Trip['status'] = 'active'): Trip => ({
  ...trip,
  id,
  status,
  departAt: trip.departAt + hours * HOUR,
});
const booked = (id: string, at: Trip, status: Booking['status']): Booking => ({
  ...booking,
  id,
  trip: at,
  status,
});

describe('the trips of the main screen (G25)', () => {
  it('shows the two nearest live bookings of a passenger, never the closed ones', () => {
    const list = [
      booked('late', tripAt('t3', 30), 'requested'),
      booked('soon', tripAt('t1', 2), 'confirmed'),
      booked('mid', tripAt('t2', 5), 'requested'),
      booked('gone', tripAt('t4', 1), 'cancelled_by_driver'),
      booked('done', tripAt('t5', 0), 'completed'),
    ];
    expect(nextBookings(list).map((item) => item.id)).toEqual(['soon', 'mid']);
    expect(nextBookings([])).toEqual([]);
  });

  it('shows the two nearest live trips of a driver with their new requests', () => {
    const trips = [tripAt('a', 10), tripAt('b', 2, 'full'), tripAt('c', 1, 'completed'), tripAt('d', 20)];
    const bookings = [
      booked('r1', tripAt('a', 10), 'requested'),
      booked('r2', tripAt('a', 10), 'requested'),
      booked('ok', tripAt('a', 10), 'confirmed'),
    ];
    expect(nextTrips(trips, bookings)).toEqual([
      { trip: trips[1], requests: 0 },
      { trip: trips[0], requests: 2 },
    ]);
  });

  it('remembers the last trip of a driver with its answers, not who rides (G40, docs/106 K3)', () => {
    const last = { ...tripAt('new', -24, 'completed'), to: '1718401', seats: 2, price: 90_000, woman: true };
    expect(lastTrip([tripAt('old', -48, 'completed'), last])).toBe(last);
    expect(lastTrip([])).toBeNull();
    expect(againOf({ ...last, comment: 'Konditsioner bor' })).toEqual({
      pickupMode: last.pickupMode,
      seats: 2,
      price: 90_000,
      comment: 'Konditsioner bor',
      // The rule of the whole car is the driver's, as the price (G61).
      bookingRule: last.bookingRule,
    });
  });
});
