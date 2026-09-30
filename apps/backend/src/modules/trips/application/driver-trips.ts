import type { Trip } from '@platform/contracts';
import { isLive, statusAt } from '../domain/trip';
import type { TripsDeps } from './ports';
import { views } from './views-of';

// The driver's trip as the family sees it when the driver shares it (G18, docs/43):
// the name, the car and the plate; never a phone.
export async function familyView(deps: TripsDeps, id: string) {
  const trip = await deps.trips.find(id);
  if (!trip) return undefined;
  const [driver, car] = [await deps.people.find(trip.driverId), trip.car];
  if (!driver || !car) return undefined;
  const { driverId, from, to, departAt, km } = trip;
  return {
    id,
    driverId,
    driverName: driver.firstName,
    car: { make: car.make, model: car.model, color: car.color },
    plate: car.plate,
    from,
    to,
    departAt,
    km,
    status: statusAt(trip, deps.now()),
  };
}

// Trips of saved drivers a passenger can still book, the earliest first (docs/18).
export async function upcomingOf(deps: TripsDeps, driverIds: readonly number[]): Promise<Trip[]> {
  const now = deps.now();
  const hidden = await deps.hidden(driverIds);
  const own = await Promise.all(
    driverIds.filter((id) => !hidden.has(id)).map((id) => deps.trips.byDriver(id)),
  );
  // Only trips that have not left yet: a saved driver's trip on the road takes nobody (docs/65 B8).
  const live = own.flat().filter((trip) => isLive(trip, now) && trip.departAt > now);
  const shown = await views(deps, live);
  return shown.filter((trip) => trip.status === 'active').sort((a, b) => a.departAt - b.departAt);
}
