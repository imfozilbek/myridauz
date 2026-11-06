import { onTheWay, type Car } from '@platform/contracts';
import { isLive } from '../domain/trip';
import type { TripsDeps } from './ports';

// The team fixed the car of a driver by its front photo (G95, docs/224): the live trips not on the way
// take it, and their posts and the card of the driver follow. A trip on the way keeps the old one:
// the people met already. A past trip stays as it was.
export async function fixLiveCar(deps: TripsDeps, driverId: number, car: Car): Promise<void> {
  const now = deps.now();
  const kept = { make: car.make, model: car.model, color: car.color, plate: car.plate };
  for (const trip of await deps.trips.byDriver(driverId)) {
    if (!isLive(trip, now) || onTheWay(trip, now)) continue;
    if (await deps.trips.fixCar(trip.id, kept, now)) await deps.changed(trip.id, 'updated');
  }
}
