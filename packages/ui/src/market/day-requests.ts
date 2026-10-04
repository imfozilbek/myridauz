import type { RideRequest } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import type { Route } from '../places/route-screen';
import { useList } from './use-list';

export type DayRequest = { readonly request: RideRequest; readonly offered: boolean };

// The requests of a day for a driver: the ones the driver already answered go down with «Taklif
// yuborildi», and a second offer is not asked (G41, docs/90 F-D1).
export function useDayRequests(route: Route, date: string) {
  const { market, bookings } = useApiClients();
  return useList(async (): Promise<DayRequest[]> => {
    const [requests, offers] = await Promise.all([
      market.searchRequests({ from: route.from.id, to: route.to.id, date }),
      bookings.driverOffers(),
    ]);
    const offered = new Set(offers.map((offer) => offer.requestId));
    const items = requests.map((request) => ({ request, offered: offered.has(request.id) }));
    return items.sort((a, b) => Number(a.offered) - Number(b.offered));
  });
}
