import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useDriver } from '../driver/driver-context';
import { recentRoutes } from '../market/recent-routes';
import { usePlaces } from '../market/places-gate';
import { useLoad } from '../market/use-list';
import { mostOf, routeChannel, type Reason } from './for-you';

type Candidates = readonly (readonly [string | null, Reason])[];

// The reasons of «Siz uchun» from what the app knows of the person (docs/119): a passenger's past
// rides, open request and last search; a driver's trips and today's requests on the driver's
// directions. A failed load offers nothing: the 20 channels stay below.
export function useForYouCandidates(): Candidates | null {
  const brand = useBrand();
  const channel = routeChannel(brand, usePlaces());
  const { comfort, market } = useApiClients();
  const driver = useDriver() !== null;
  const { value } = useLoad<Candidates>(async () => {
    if (driver) {
      const [trips, board] = await Promise.all([market.myTrips(), market.requestBoard({})]);
      const [last] = [...trips].sort((a, b) => b.departAt - a.departAt);
      return [
        [mostOf(trips, channel), 'drives'],
        [mostOf([...board.fits, ...board.others], channel), 'requests'],
        [last ? channel(last) : null, 'lastTrip'],
      ];
    }
    const [rides, requests] = await Promise.all([comfort.history(), market.myRequests()]);
    const open = requests.find((request) => request.status === 'open');
    const [search] = recentRoutes();
    return [
      [mostOf(rides, channel), 'often'],
      [open ? channel(open) : null, 'request'],
      [search ? channel(search) : null, 'search'],
    ];
  });
  return value;
}
