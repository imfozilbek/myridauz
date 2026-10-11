import { MY_TRIP_LINK, type Trip } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmed, wallet } from '../bookings/booking-test-kit';
import { renderMarket, trip } from '../market/market-test-kit';
import { MyTripsScreen } from '../market/my-trips-screen';
import { testClients } from '../test-shell';
import { fiveStars } from '../trip-end/past-trip-kit';
import type { TripScreen } from './own-trip-opened';

afterEach(cleanup);

function open(shown: Trip, tripScreen: TripScreen) {
  const rider = { ...confirmed, trip: shown };
  renderMarket(
    <MyTripsScreen onBack={vi.fn()} link={{ name: MY_TRIP_LINK, id: shown.id }} tripScreen={tripScreen} />,
    testClients({
      market: { myTrips: async () => [shown], searchRequests: async () => [] },
      bookings: { driverBookings: async () => [rider], driverOffers: async () => [] },
      feedback: { review: async () => undefined, target: fiveStars },
      wallet: { mine: async () => wallet },
    }),
  );
}

// The buttons of the block at the bottom open the trip right where they lead (G76, docs/165).
describe('a trip opened from the block of a driver', { timeout: 20_000 }, () => {
  it('on «Safar tugadi» with its stars after «Yetib keldik» or «Baho berish»', async () => {
    open({ ...trip, departedAt: trip.departAt, arrivedAt: Date.now() }, 'end');
    expect(await screen.findByText('Safar tugadi')).toBeTruthy();
    expect(screen.getByText('Yoʻlovchilarni baholang')).toBeTruthy();
  });

  it('on the map of the way after «Yoʻl xaritasi»', async () => {
    open(trip, 'map');
    expect(await screen.findByText(/ · \d+ yoʻlovchi$/u)).toBeTruthy();
  });
});
