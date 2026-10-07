import {
  COUNTED_DAYS,
  DAY_MS,
  DIRECTION_CARDS,
  tashkentDate,
  tashkentDayStart,
  type DirectionCard,
  type TripDays,
} from '@platform/contracts';
import { placeMatches, placesMatching } from '../../../shared/places/place-match';
import { POPULAR_REGIONS } from '../domain/popular-regions';
import type { TripRecord } from '../domain/trip';
import type { Result, TripsDeps } from './ports';

type Open = { readonly trip: TripRecord; readonly date: string };

// The trips from a place with a free seat for some days from today: one read by the index trips_from
// and one of their confirmed seats (docs/117). Own trips are not counted: they are not in the search.
async function openTrips(deps: TripsDeps, from: string, days: number, viewer?: number) {
  const now = deps.now();
  const today = tashkentDate(now);
  const places = await deps.places();
  const end = tashkentDayStart(today) + days * DAY_MS;
  const trips = (await deps.trips.leaving(now, end, placesMatching(from, places))).filter(
    (trip) => trip.driverId !== viewer,
  );
  const taken = new Map<string, number>();
  for (const rider of await deps.riders(trips.map((trip) => trip.id)))
    taken.set(rider.tripId, (taken.get(rider.tripId) ?? 0) + rider.seats);
  const open: Open[] = trips
    .filter((trip) => trip.seats > (taken.get(trip.id) ?? 0))
    .map((trip) => ({ trip, date: tashkentDate(trip.departAt) }));
  return { open, places, today, tomorrow: tashkentDate(tashkentDayStart(today) + DAY_MS) };
}

// «Safarlar»: the trips of each day of a week on a route, and the way «≈ 300 km».
export async function tripDays(
  deps: TripsDeps,
  from: string,
  to: string,
  viewer?: number,
): Promise<Result<TripDays, 'locations.not_found' | 'locations.same_place' | 'locations.inside_city'>> {
  const way = await deps.recommend(from, to);
  if (!way.ok) return way;
  const { open, places, today } = await openTrips(deps, from, COUNTED_DAYS, viewer);
  const fits = open.filter(({ trip }) => placeMatches(trip.to, to, places));
  const days = Array.from({ length: COUNTED_DAYS }, (_, index) => {
    const date = tashkentDate(tashkentDayStart(today) + index * DAY_MS);
    return { date, trips: fits.filter((item) => item.date === date).length };
  });
  return { ok: true, value: { km: way.value.km, days } };
}

// «Qayerga borasiz?»: the directions with the most trips today and tomorrow, then the popular ones;
// «… soʻmdan» is the cheapest seat of those trips or the recommended price.
export async function directionCards(
  deps: TripsDeps,
  from: string,
  viewer?: number,
): Promise<DirectionCard[]> {
  const { open, places, today, tomorrow } = await openTrips(deps, from, 2, viewer);
  const regionOf = (id: string) => places.get(id)?.parentId ?? id;
  const home = regionOf(from);
  const byRegion = new Map<string, Open[]>();
  for (const item of open) {
    const region = regionOf(item.trip.to);
    if (region !== home) byRegion.set(region, [...(byRegion.get(region) ?? []), item]);
  }
  const busiest = [...byRegion.keys()].sort(
    (a, b) => (byRegion.get(b)?.length ?? 0) - (byRegion.get(a)?.length ?? 0),
  );
  const order = [...new Set([...busiest, ...POPULAR_REGIONS])].filter(
    (region) => region !== home && places.has(region),
  );
  const cards = await Promise.all(
    order.slice(0, DIRECTION_CARDS).map(async (to) => {
      const trips = byRegion.get(to) ?? [];
      const cheapest = Math.min(...trips.map(({ trip }) => trip.price));
      const recommended = trips.length > 0 ? null : await deps.recommend(from, to);
      const price = recommended ? (recommended.ok ? recommended.value.price : null) : cheapest;
      const count = (date: string) => trips.filter((item) => item.date === date).length;
      return price === null ? null : { to, today: count(today), tomorrow: count(tomorrow), price };
    }),
  );
  return cards.filter((card) => card !== null);
}
