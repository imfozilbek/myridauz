import type { Point, RideRequestData } from '@platform/contracts';
import { regionIn } from '../../../shared/places/place-match';
import type { RequestsDeps } from './ports';

// A point as it is kept: the two numbers, nothing more from the input.
export const plain = ({ lat, lng }: Point) => ({ lat, lng });

// The way of a request (docs/70): «Pitakdan» only where the direction has a pitak; a point at the
// door unless only the pitak suits; the points in the districts of the route (docs/69).
export async function wayError(deps: RequestsDeps, input: RideRequestData) {
  const regionOf = regionIn(await deps.places());
  const pitak = await deps.pitakOf(regionOf(input.from), regionOf(input.to));
  if (input.pickupMode === 'pitak' && !pitak) return 'bookings.wrong_mode';
  if (input.pickupMode !== 'pitak' && !input.pickup) return 'bookings.wrong_mode';
  const pickupFits = input.pickupMode === 'pitak' || (input.pickup && deps.fits(input.pickup, input.from));
  return pickupFits && deps.fits(input.dropoff, input.to) ? null : 'bookings.outside_area';
}
