import type { Booking, Offer, RideRequest } from '@platform/contracts';
import { createContext, useContext, type ReactNode } from 'react';
import { useApiClients } from '../context/api-clients';
import { useLoad } from '../market/use-list';

type PassengerLists = readonly [readonly Booking[], readonly RideRequest[], readonly Offer[]];
export type PassengerLoad = ReturnType<typeof useLoad<PassengerLists>>;

const PassengerDataContext = createContext<PassengerLoad | null>(null);

// The bookings, requests and offers of the passenger, loaded once for the main screen: its block
// and the badges of its tiles read the same lists (G53). A signal refreshes them (docs/64).
export function PassengerData({ children }: { readonly children: ReactNode }) {
  const { bookings, market } = useApiClients();
  const load = useLoad<PassengerLists>(
    () => Promise.all([bookings.myBookings(), market.myRequests(), bookings.myOffers()]),
    'home.passenger',
  );
  return <PassengerDataContext.Provider value={load}>{children}</PassengerDataContext.Provider>;
}

export function usePassengerData(): PassengerLoad {
  const load = useContext(PassengerDataContext);
  if (!load) throw new Error('ui.passenger_data_missing');
  return load;
}
