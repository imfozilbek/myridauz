import type { AppLink, Booking, Trip } from '@platform/contracts';
import type { ReactNode } from 'react';
import { DriverContext, type Driver } from '../driver/driver-context';
import { FeedContext } from '../feed/feed-context';
import { StartFlow } from '../flow/start-flow';
import type { HomeGo, Launch, StartAction } from '../flow/start-action';
import { FindTripFlow } from '../market/find-trip-flow';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';

// Test helper for the main screen (G25): the actions of an app, the feed signal by hand.
type Opened = { readonly onBack: () => void } & Launch;
// A section shows what the main screen gave it: the link, the route.
function Shown({ link, route }: Opened) {
  const what = link ? `${link.name}:${link.id}` : route ? `${route.from.name}>${route.to.name}` : 'empty';
  return <p>{`opened ${what}`}</p>;
}
const action = (id: string, Screen: StartAction['Screen']): StartAction => ({
  id,
  icon: 'trip',
  tone: 'brand',
  labelKey: 'common.myTrips',
  hintKey: 'common.passenger.myTripsHint',
  ...(Screen ? { Screen } : {}),
});
export const PASSENGER_ACTIONS = [action('find_trip', FindTripFlow), action('my_trips', Shown)];
export const DRIVER_ACTIONS = [action('new_trip', Shown), action('my_trips', Shown)];

export const approved: Driver = {
  application: {
    status: 'approved',
    car: { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 },
    photos: { front: true, side: true, interior: true },
    reasons: [],
  },
  editCar: () => undefined,
};

type Data = {
  readonly bookings?: () => Promise<Booking[]>;
  readonly trips?: () => Promise<Trip[]>;
  readonly requests?: () => Promise<Booking[]>;
};

export function renderHome(
  home: (go: HomeGo) => ReactNode,
  actions: readonly StartAction[],
  data: Data,
  driver: Driver = approved,
) {
  let signal: () => void = () => undefined;
  const subscribe = (listener: () => void) => {
    signal = listener;
    return () => undefined;
  };
  const clients = testClients({
    bookings: {
      ...(data.bookings ? { myBookings: data.bookings } : {}),
      ...(data.requests ? { driverBookings: data.requests } : {}),
    },
    ...(data.trips ? { market: { myTrips: data.trips } } : {}),
    map: { where: async () => Promise.reject(new Error('none')) },
  });
  const result = renderMarket(
    <FeedContext.Provider value={subscribe}>
      <DriverContext.Provider value={driver}>
        <StartFlow actions={actions} home={home} />
      </DriverContext.Provider>
    </FeedContext.Provider>,
    clients,
  );
  return { ...result, signal: () => signal() };
}

export const linkOf = (link: AppLink) => `opened ${link.name}:${link.id}`;
