import type { BookingsClient, FeedbackClient } from '@platform/api-client';
import { arrivalAt, HOUR_MS, type Booking, type Trip } from '@platform/contracts';
import { useState } from 'react';
import { vi } from 'vitest';
import { wallet } from '../bookings/booking-test-kit';
import { renderMarket } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { akmal, madina } from '../meeting/meet-test-kit';
import { testClients } from '../test-shell';
import { PastTripFlow } from './past-trip-flow';

// Test helper for the past trip of the driver (mockup g63/5 phone 5): Madina rated, Akmal did not come.
export const trip = { ...madina.trip, status: 'completed' as const, seatsLeft: 0 };
export const rode = { ...madina, trip, status: 'completed' as const, rated: true };
export const gone = { ...akmal, trip, status: 'completed' as const, noShowAt: trip.departAt };
// The evening of the trip: the chat is open until tomorrow, six days are left to rate (mockup).
const EVENING = arrivalAt(trip.departAt, trip.km) + 7 * HOUR_MS;

const fiveStars = async () => ({
  rateeId: madina.passenger.id,
  rateeName: 'Madina',
  rateeRole: 'passenger' as const,
  mine: { stars: 5, tags: [], text: '' },
});

// The page keeps the bookings of the server: after the stars the list comes again, rated.
type PageProps = { readonly of: Trip; readonly start: readonly Booking[]; readonly onPublish: () => void };
function Page({ of, start, onPublish }: PageProps) {
  const [bookings, setBookings] = useState(start);
  const reload = () => setBookings(bookings.map((booking) => ({ ...booking, rated: true })));
  return (
    <PastTripFlow trip={of} bookings={bookings} onBack={vi.fn()} onChanged={reload} onPublish={onPublish} />
  );
}

type Options = {
  readonly target?: FeedbackClient['target'];
  readonly now?: number;
  readonly of?: Trip;
  readonly meet?: BookingsClient['meet'];
};

export function openPast(
  bookings: readonly Booking[],
  { target = fiveStars, now = EVENING, of = trip, meet = vi.fn() }: Options = {},
) {
  vi.setSystemTime(now);
  const onPublish = vi.fn();
  renderMarket(
    <PlacesGate>
      <Page of={of} start={bookings} onPublish={onPublish} />
    </PlacesGate>,
    testClients({
      feedback: { target, review: async () => undefined },
      wallet: { mine: async () => wallet },
      market: { searchRequests: async () => [] },
      bookings: { meet },
    }),
  );
  return onPublish;
}
