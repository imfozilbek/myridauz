import type { AppLink, Booking, Favorites, Offer, RideRequest, Trip, Wallet } from '@platform/contracts';
import { searchMarket } from '../find/search-test-kit';
import type { ReactNode } from 'react';
import { DriverContext, type Driver } from '../driver/driver-context';
import { FeedContext } from '../feed/feed-context';
import { StartFlow } from '../flow/start-flow';
import type { HomeGo, Launch, StartAction } from '../flow/start-action';
import { FindTripFlow } from '../market/find-trip-flow';
import { locations, renderMarket } from '../market/market-test-kit';
import { LocationsClientContext } from '../places/directory';
import { testClients } from '../test-shell';
import { WALLET_ACTION } from '../wallet/wallet-flow';
import { DriverData } from './driver-data';
import { DriverTiles } from './driver-tiles';
import { PassengerData } from './passenger-data';
import { PassengerTiles } from './passenger-tiles';

// Test helper for the main screen (G25): the actions of an app, the feed signal by hand.
type Opened = { readonly onBack: () => void } & Launch;
// A section shows what the main screen gave it: the link, the route, the end to choose.
function Shown({ link, route, pick }: Opened) {
  const what = link
    ? `${link.name}:${link.id}`
    : route
      ? `${route.from.name}>${route.to.name}`
      : (pick ?? 'empty');
  return <p>{`opened ${what}`}</p>;
}
const action = (
  id: string,
  Screen: StartAction['Screen'],
  labelKey: StartAction['labelKey'] = 'common.myTrips',
): StartAction => ({
  id,
  icon: 'trip',
  tone: 'brand',
  labelKey,
  hintKey: 'common.passenger.myTripsHint',
  Screen,
});
export const PASSENGER_ACTIONS = [
  action('find_trip', FindTripFlow, 'common.passenger.findTrip'),
  action('my_trips', Shown),
];
export const DRIVER_ACTIONS = [action('new_trip', Shown, 'home.publish'), action('my_trips', Shown)];

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
  // The requests and the offers of a passenger, none by default (G53).
  readonly asked?: () => Promise<RideRequest[]>;
  readonly offers?: () => Promise<Offer[]>;
  readonly wallet?: () => Promise<Wallet>;
  // The saved drivers of a passenger and their trips, none by default (G60).
  readonly favorites?: () => Promise<Favorites>;
  // The directory of places fails this many times first.
  readonly placesFail?: number;
  // The action of the main button (G25).
  readonly covered?: string;
};

const none = async () => [];

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
      myOffers: data.offers ?? none,
    },
    ...(data.wallet ? { wallet: { mine: data.wallet } } : {}),
    comfort: { favorites: data.favorites ?? (async () => ({ drivers: [], trips: [] })) },
    market: {
      ...searchMarket(),
      searchTrips: none,
      myRequests: data.asked ?? none,
      ...(data.trips ? { myTrips: data.trips } : {}),
    },
    map: { where: async () => Promise.reject(new Error('none')) },
  });
  let fails = data.placesFail ?? 0;
  const places = {
    getLocations: async () => {
      if (fails-- > 0) throw new Error('down');
      return locations.getLocations();
    },
  };
  const flow = (
    <DriverData>
      <StartFlow
        actions={actions}
        home={home}
        tiles={(go) => <DriverTiles go={go} />}
        sections={[WALLET_ACTION]}
        {...(data.covered ? { mainTile: data.covered } : {})}
      />
    </DriverData>
  );
  // A passenger main screen has its lists and tiles, as in the app (G53).
  const passenger = (
    <PassengerData>
      <StartFlow
        actions={actions}
        home={home}
        tiles={(go, openProfile) => <PassengerTiles go={go} openProfile={openProfile} />}
        {...(data.covered ? { covered: data.covered } : {})}
      />
    </PassengerData>
  );
  const result = renderMarket(
    <LocationsClientContext.Provider value={places}>
      <FeedContext.Provider value={subscribe}>
        <DriverContext.Provider value={driver}>{data.bookings ? passenger : flow}</DriverContext.Provider>
      </FeedContext.Provider>
    </LocationsClientContext.Provider>,
    clients,
  );
  return { ...result, signal: () => signal() };
}

export const linkOf = (link: AppLink) => `opened ${link.name}:${link.id}`;
