import type { Booking, Favorites, Offer, RequestBoard, RideRequest, Trip, Wallet } from '@platform/contracts';
import type { ReactNode } from 'react';
import { DriverContext, type Driver } from '../driver/driver-context';
import { FeedContext } from '../feed/feed-context';
import { searchMarket } from '../find/search-test-kit';
import { StartFlow } from '../flow/start-flow';
import type { HomeGo, StartAction } from '../flow/start-action';
import { testMap } from '../map/map-test-kit';
import { locations, renderMarket } from '../market/market-test-kit';
import { LocationsClientContext } from '../places/directory';
import { testClients } from '../test-shell';
import { WALLET_ACTION } from '../wallet/wallet-flow';
import { DRIVER_DOCK_SECTIONS, PASSENGER_SECTIONS } from './dock-sections';
import { DriverData } from './driver-data';
import { DriverDock } from './driver-dock';
import { DriverTiles } from './driver-tiles';
import { NEW_TRIP } from './home-test-actions';
import { HomeRouteProvider } from './home-route';
import { PassengerData } from './passenger-data';
import { PassengerDock } from './passenger-dock';
import { PassengerTiles } from './passenger-tiles';

// Test helper for the main screen (G25, G66): the lists of an app, the feed signal by hand.
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
  // The requests on the directions of a driver (G66).
  readonly board?: () => Promise<RequestBoard>;
  // The saved drivers of a passenger and their trips, none by default (G60).
  readonly favorites?: () => Promise<Favorites>;
  // The directory of places fails this many times first.
  readonly placesFail?: number;
  // The map knows the district of a point: «Qayerdan» where the person stands (G66).
  readonly where?: boolean;
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
      ...(data.board ? { requestBoard: data.board } : {}),
    },
    map: data.where ? testMap() : { where: async () => Promise.reject(new Error('none')) },
  });
  let fails = data.placesFail ?? 0;
  const places = {
    getLocations: async () => {
      if (fails-- > 0) throw new Error('down');
      return locations.getLocations();
    },
  };
  // The block at the bottom as in the apps (G66): none before the application is sent.
  const sent = driver.application.status !== 'draft';
  const flow = (
    <DriverData>
      <HomeRouteProvider>
        <StartFlow
          actions={actions}
          home={home}
          tiles={(go, openProfile) => <DriverTiles go={go} openProfile={openProfile} />}
          sections={[NEW_TRIP, WALLET_ACTION, ...DRIVER_DOCK_SECTIONS]}
          {...(sent ? { dock: (go: HomeGo) => <DriverDock go={go} /> } : {})}
        />
      </HomeRouteProvider>
    </DriverData>
  );
  // A passenger main screen has its lists, tiles and block, as in the app (G53, G66).
  const passenger = (
    <PassengerData>
      <HomeRouteProvider>
        <StartFlow
          actions={actions}
          home={home}
          tiles={(go, openProfile) => <PassengerTiles go={go} openProfile={openProfile} />}
          dock={(go) => <PassengerDock go={go} />}
          sections={PASSENGER_SECTIONS}
          covered="find_trip"
        />
      </HomeRouteProvider>
    </PassengerData>
  );
  const result = renderMarket(
    <LocationsClientContext.Provider value={places}>
      <FeedContext.Provider value={subscribe}>
        {data.bookings ? passenger : <DriverContext.Provider value={driver}>{flow}</DriverContext.Provider>}
      </FeedContext.Provider>
    </LocationsClientContext.Provider>,
    clients,
  );
  return { ...result, signal: () => signal() };
}
