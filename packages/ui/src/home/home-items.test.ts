import type { Booking, Trip } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { booking } from '../bookings/booking-test-kit';
import { trip } from '../market/market-test-kit';
import { lastRoute, nextBookings, nextTrips } from './home-items';

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
    const shown = nextBookings(list);
    expect(shown.items.map((item) => item.id)).toEqual(['soon', 'mid']);
    expect(shown.more).toBe(true);
    expect(nextBookings([])).toEqual({ items: [], more: false });
  });

  it('shows the two nearest live trips of a driver with their new requests', () => {
    const trips = [tripAt('a', 10), tripAt('b', 2, 'full'), tripAt('c', 1, 'completed'), tripAt('d', 20)];
    const bookings = [
      booked('r1', tripAt('a', 10), 'requested'),
      booked('r2', tripAt('a', 10), 'requested'),
      booked('ok', tripAt('a', 10), 'confirmed'),
    ];
    expect(nextTrips(trips, bookings)).toEqual({
      items: [
        { trip: trips[1], requests: 0 },
        { trip: trips[0], requests: 2 },
      ],
      more: true,
    });
  });

  it('remembers the route of the last trip of a driver', () => {
    const trips = [tripAt('old', -48, 'completed'), { ...tripAt('new', -24, 'completed'), to: '1718401' }];
    expect(lastRoute(trips)).toEqual({ from: trip.from, to: '1718401' });
    expect(lastRoute([])).toBeNull();
  });
});
