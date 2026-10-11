import { useApiClients } from '../context/api-clients';
import { useDriverData } from '../home/driver-data';
import { MY_TRIPS } from './my-trips-list';
import { useLoad } from './use-list';

// The lists of «Mening safarlarim» of a driver (G77): the trips and their bookings are the lists of
// the main screen, not a second load; only the sent offers load here.
export function useMyTripsLists() {
  const { bookings } = useApiClients();
  const lists = useDriverData();
  const offers = useLoad(() => bookings.driverOffers(), `${MY_TRIPS}.offers`);
  const value = lists.value && offers.value ? ([...lists.value, offers.value] as const) : null;
  return {
    value,
    failed: lists.failed || offers.failed,
    reload: () => {
      lists.reload();
      offers.reload();
    },
    refresh: () => Promise.all([lists.refresh(), offers.refresh()]).then(() => undefined),
  };
}
