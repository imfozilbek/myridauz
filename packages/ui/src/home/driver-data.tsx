import type { Booking, Trip } from '@platform/contracts';
import { createContext, useContext, type ReactNode } from 'react';
import { useApiClients } from '../context/api-clients';
import type { TileLive } from '../flow/start-action';
import { useLoad } from '../market/use-list';
import { nextTrips } from './home-items';

type DriverLists = readonly [readonly Trip[], readonly Booking[]];
export type DriverLoad = ReturnType<typeof useLoad<DriverLists>>;

const DriverDataContext = createContext<DriverLoad | null>(null);

// The trips of the driver and the requests on them, loaded once for the main screen: its block and
// the badge of «Mening safarlarim» read the same lists (G53). A signal refreshes them (docs/64).
export function DriverData({ children }: { readonly children: ReactNode }) {
  const { market, bookings } = useApiClients();
  const load = useLoad<DriverLists>(
    () => Promise.all([market.myTrips(), bookings.driverBookings()]),
    'home.trips',
  );
  return <DriverDataContext.Provider value={load}>{children}</DriverDataContext.Provider>;
}

export function useDriverData(): DriverLoad {
  const load = useContext(DriverDataContext);
  if (!load) throw new Error('ui.driver_data_missing');
  return load;
}

// «Mening safarlarim»: the new requests of passengers on the live trips, not answered yet.
export function useDriverTripsLive(): TileLive {
  const { value } = useDriverData();
  if (!value) return {};
  const [trips, requests] = value;
  const live = nextTrips(trips, requests, Infinity);
  return { badge: live.reduce((sum, item) => sum + item.requests, 0) };
}
