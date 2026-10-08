import type { MarketClient } from '@platform/api-client';
import { DAY_MS, type Recommendation } from '@platform/contracts';
import { fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { DriverContext, type Driver } from '../driver/driver-context';
import type { Route } from '../places/route-screen';
import { testMap } from '../map/map-test-kit';
import { testClients } from '../test-shell';
import { recommendation, renderMarket, tap, trip } from './market-test-kit';
import { NewTripFlow } from './new-trip-flow';
import type { TripAgain } from './trip-draft';

// Test helper of a new trip (G63): a Cobalt of 4 seats, the trip it publishes tomorrow.
const driver = (status: Driver['application']['status']): Driver => ({
  application: {
    status,
    car: { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 },
    photos: { front: true, side: true, interior: true },
    reasons: [],
  },
  editCar: () => undefined,
});
const published = { ...trip, departAt: Date.now() + DAY_MS };

type Options = {
  readonly gender?: 'male' | 'female';
  readonly status?: Driver['application']['status'];
  // The direction has its pitak (docs/72).
  readonly pitak?: boolean;
  readonly recommend?: () => Promise<Recommendation>;
  readonly route?: Route;
  readonly again?: TripAgain;
};

export function openNewTrip(options: Options = {}) {
  const { gender = 'male', status = 'approved', pitak = true } = options;
  const publishTrip = vi.fn<MarketClient['publishTrip']>(async () => published);
  const clients = testClients({
    market: {
      recommend: options.recommend ?? (async () => recommendation),
      publishTrip,
      myTrips: async () => [published],
    },
    bookings: { driverBookings: async () => [] },
    map: testMap(pitak ? {} : { pitakOf: vi.fn(async () => null) }),
  });
  const result = renderMarket(
    <DriverContext.Provider value={driver(status)}>
      <NewTripFlow
        onBack={() => undefined}
        {...(options.route ? { route: options.route } : {})}
        {...(options.again ? { again: options.again } : {})}
      />
    </DriverContext.Provider>,
    clients,
    gender,
  );
  return { ...result, publishTrip };
}

// The two steppers of the screen: the seats first, the price second.
export const seatsLess = () => fireEvent.click(screen.getAllByLabelText('Kamaytirish')[0] as HTMLElement);
export const seatsMore = () => fireEvent.click(screen.getAllByLabelText('Oshirish')[0] as HTMLElement);

// The day row opens the day and the time; «Ertaga» at 08:00 comes back to the screen.
export async function tomorrowAtEight() {
  await tap(/^(Bugun|Ertaga), \d\d:\d\d$/u);
  await tap('Ertaga');
  await tap('Davom etish');
  await screen.findByText('Ertaga, 08:00');
}
