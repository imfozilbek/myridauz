import type { MarketClient } from '@platform/api-client';
import { DAY_MS, MINUTE_MS, type Location, type Recommendation } from '@platform/contracts';
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
  // Only «Qayerga» of the block at the bottom of the main screen (G79 В4).
  readonly to?: Location;
};

export function openNewTrip(options: Options = {}) {
  const { gender = 'male', status = 'approved', pitak = true } = options;
  // A minute after 17:00, never at the edge of a half hour: the first free time on the screen is still
  // the one that goes at the tap (G77: a time that became too soon opens the day and the time).
  vi.setSystemTime(Date.now() + MINUTE_MS);
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
        {...(options.to ? { to: options.to } : {})}
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

// The day row opens the sheet of the day and the time (G75); «Ertaga» at 08:00 comes back to the screen.
export async function tomorrowAtEight() {
  await tap(/^(Bugun|Ertaga), \d\d:\d\d$/u);
  fireEvent.click(await screen.findByRole('button', { name: /^Ertaga/u }));
  await tap('Tayyor');
  await screen.findByText('Ertaga, 08:00');
}
