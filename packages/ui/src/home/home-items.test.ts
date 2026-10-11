import type { Booking, Trip } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { booking } from '../bookings/booking-test-kit';
import { trip } from '../market/market-test-kit';
import { nextBookings } from './home-items';

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
});
