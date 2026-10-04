import type { Trip, TripInput } from '@platform/contracts';
import { departError, endsAt, type TripRecord } from '../domain/trip';
import type { Result, TripsDeps } from './ports';
import { scheduleError, type ScheduleError } from './schedule';
import { views } from './views-of';

export type PublishError =
  | 'trips.not_driver'
  | 'trips.too_many_seats'
  | 'trips.in_past'
  | 'trips.invalid_input'
  | 'trips.price_out_of_bounds'
  | ScheduleError
  | 'locations.not_found'
  | 'locations.same_place'
  | 'locations.inside_city';

type Input = Required<
  Pick<TripInput, 'from' | 'to' | 'departAt' | 'seats' | 'price' | 'womanOnBoard' | 'pickupMode'>
> & { readonly comment: string };

// Only an approved driver publishes (docs/04), within the seats of the car and the price bounds (docs/09),
// at a time the driver makes (docs/103).
export async function publishTrip(
  deps: TripsDeps,
  driverId: number,
  input: Input,
): Promise<Result<Trip, PublishError>> {
  const now = deps.now();
  const [car, driver] = await Promise.all([deps.approvedCar(driverId), deps.people.find(driverId)]);
  if (!car || !driver) return { ok: false, error: 'trips.not_driver' };
  if (input.seats > car.seats) return { ok: false, error: 'trips.too_many_seats' };
  const timeError = departError(input.departAt, now);
  if (timeError) return { ok: false, error: timeError };
  const recommendation = await deps.recommend(input.from, input.to);
  if (!recommendation.ok) return recommendation;
  const { km, minPrice, maxPrice, price: recommended } = recommendation.value;
  if (input.price < minPrice || input.price > maxPrice)
    return { ok: false, error: 'trips.price_out_of_bounds' };
  const busy = await scheduleError(deps, driverId, { ...input, km });
  if (busy) return { ok: false, error: busy };
  const trip: TripRecord = {
    ...input,
    comment: deps.mask(input.comment),
    car: { make: car.make, model: car.model, color: car.color, plate: car.plate },
    id: deps.newId(),
    driverId,
    endsAt: endsAt(input.departAt, km),
    km,
    status: 'active',
    createdAt: now,
    firstDepartAt: input.departAt,
    firstPrice: input.price,
    priceToldAt: null,
  };
  await deps.trips.save(trip);
  await deps.announce(trip);
  await deps.changed(trip.id, 'published');
  const [view] = await views(deps, [trip]);
  return view
    ? { ok: true, value: { ...view, recommendedPrice: recommended } }
    : { ok: false, error: 'trips.not_driver' };
}
