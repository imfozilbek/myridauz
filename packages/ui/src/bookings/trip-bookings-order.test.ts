import type { Booking } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { confirmed } from './booking-test-kit';
import { requestsInOrder, takenFirst } from './trip-bookings-order';

const of = (id: string, status: Booking['status'], over: Partial<Booking> = {}): Booking => ({
  ...confirmed,
  id,
  status,
  ...over,
});

describe('the bookings of a trip for its driver (docs/90 F-D11)', () => {
  it('puts the requests by the extra way, then the one that expires first', () => {
    const order = requestsInOrder([
      of('late', 'requested', { extraKm: 0, expiresAt: 900 }),
      of('far', 'requested', { extraKm: 9, expiresAt: 100 }),
      of('soon', 'requested', { extraKm: 0, expiresAt: 200 }),
    ]);
    expect(order.map((booking) => booking.id)).toEqual(['soon', 'late', 'far']);
  });

  it('puts the taken seats first and the cancelled or declined ones last', () => {
    const order = takenFirst([
      of('gone', 'cancelled_by_passenger'),
      of('taken', 'confirmed'),
      of('no', 'declined'),
      of('done', 'completed'),
    ]);
    expect(order.map((booking) => booking.id)).toEqual(['taken', 'done', 'gone', 'no']);
  });
});
