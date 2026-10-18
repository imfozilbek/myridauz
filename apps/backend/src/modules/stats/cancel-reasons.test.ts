import { describe, expect, it } from 'vitest';
import { cancelReasonsOf } from './domain/cancel-reasons';

const counter = (code: string, events: number, name = 'cancel_reason') => ({
  name,
  app: 'passenger',
  code,
  sessions: events,
  events,
});

// G87 V3 (docs/191): why seats, trips and accounts went, the most given first.
describe('the reasons of cancels', () => {
  it('sums each reason over the Mini Apps, most first, and leaves odd codes out', () => {
    expect(
      cancelReasonsOf([
        counter('booking.plans', 2),
        { ...counter('booking.plans', 3), app: 'driver' },
        counter('trip.empty', 4),
        counter('trip.found', 9),
        counter('nothing', 9),
        counter('booking.plans', 7, 'booking_step'),
      ]),
    ).toEqual([
      { what: 'booking', reason: 'plans', count: 5 },
      { what: 'trip', reason: 'empty', count: 4 },
    ]);
  });
});
