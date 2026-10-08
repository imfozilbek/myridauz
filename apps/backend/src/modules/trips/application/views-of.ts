import type { Trip } from '@platform/contracts';
import type { Person } from '../../users';
import type { TripRecord } from '../domain/trip';
import { regionIn } from '../../../shared/places/place-match';
import type { TripsDeps } from './ports';
import { NO_RIDERS, tripView, type Riders } from './views';

// Views of many trips: the driver and the car are read once per driver.
async function ridersOf(deps: TripsDeps, trips: readonly TripRecord[]): Promise<Map<string, Riders>> {
  const riders = await deps.riders(trips.map((trip) => trip.id));
  const women = await Promise.all(
    riders.map(async (rider) => (await deps.people.find(rider.passengerId))?.gender === 'female'),
  );
  const byTrip = new Map<string, Riders>();
  riders.forEach((rider, index) => {
    const known = byTrip.get(rider.tripId) ?? { seats: 0, woman: false };
    byTrip.set(rider.tripId, {
      seats: known.seats + rider.seats,
      woman: known.woman || women[index] === true || rider.withWoman,
    });
  });
  return byTrip;
}

// The recommended price of each route once: shown next to the driver's price (docs/40, question 44).
async function recommendedOf(deps: TripsDeps, trips: readonly TripRecord[]): Promise<Map<string, number>> {
  const routes = [...new Set(trips.map((trip) => `${trip.from}:${trip.to}`))];
  const prices = await Promise.all(
    routes.map(async (route) => {
      const [from = '', to = ''] = route.split(':');
      const found = await deps.recommend(from, to);
      return found.ok ? ([route, found.value.price] as const) : null;
    }),
  );
  return new Map(prices.filter((price) => price !== null));
}

// The main pitak of each direction once: the region of the start and of the end (docs/72).
async function pitaksOf(deps: TripsDeps, trips: readonly TripRecord[]) {
  const regionOf = regionIn(await deps.places());
  const directions = [...new Set(trips.map((trip) => `${regionOf(trip.from)}:${regionOf(trip.to)}`))];
  const found = await Promise.all(
    directions.map(async (direction) => {
      const [from = '', to = ''] = direction.split(':');
      return [direction, await deps.pitakOf(from, to)] as const;
    }),
  );
  const byDirection = new Map(found);
  return (trip: TripRecord) => byDirection.get(`${regionOf(trip.from)}:${regionOf(trip.to)}`) ?? null;
}

export async function views(deps: TripsDeps, trips: readonly TripRecord[]): Promise<Trip[]> {
  const now = deps.now();
  const [riders, ratings, recommended, pitakOf] = await Promise.all([
    ridersOf(deps, trips),
    deps.ratings([...new Set(trips.map((trip) => trip.driverId))]),
    recommendedOf(deps, trips),
    pitaksOf(deps, trips),
  ]);
  const drivers = new Map<number, Promise<Person | undefined>>();
  const driverOf = (id: number) => {
    const known = drivers.get(id);
    if (known) return known;
    const loading = deps.people.find(id);
    drivers.set(id, loading);
    return loading;
  };
  const found = await Promise.all(
    trips.map(async (trip) => {
      // The car kept in the trip: a new check of the driver hides nothing (docs/65 A1).
      const [driver, car] = [await driverOf(trip.driverId), trip.car];
      if (!driver || !car) return null;
      const price = recommended.get(`${trip.from}:${trip.to}`) ?? null;
      return tripView(
        trip,
        driver,
        car,
        now,
        riders.get(trip.id) ?? NO_RIDERS,
        ratings.get(trip.driverId),
        price,
        pitakOf(trip),
      );
    }),
  );
  return found.filter((trip) => trip !== null);
}
