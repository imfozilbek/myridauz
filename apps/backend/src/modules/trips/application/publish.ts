import { MAX_ACTIVE_TRIPS, type Trip, type TripInput } from '@platform/contracts';
import { departError, endsAt, isLive, type TripRecord } from '../domain/trip';
import type { Result, TripsDeps } from './ports';
import { NO_RIDERS, tripView } from './views';

export type PublishError =
  | 'trips.not_driver'
  | 'trips.too_many_seats'
  | 'trips.in_past'
  | 'trips.invalid_input'
  | 'trips.price_out_of_bounds'
  | 'trips.too_many'
  | 'locations.not_found'
  | 'locations.same_place'
  | 'locations.inside_city';

type Input = Required<Pick<TripInput, 'from' | 'to' | 'departAt' | 'seats' | 'price' | 'womanOnBoard'>> & {
  readonly comment: string;
};

// Only an approved driver publishes (docs/04), within the seats of the car and the price bounds (docs/09).
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
  const live = (await deps.trips.byDriver(driverId)).filter((trip) => isLive(trip, now));
  if (live.length >= MAX_ACTIVE_TRIPS) return { ok: false, error: 'trips.too_many' };
  const trip: TripRecord = {
    ...input,
    id: deps.newId(),
    driverId,
    endsAt: endsAt(input.departAt, km),
    km,
    status: 'active',
    meetingPoint: null,
    meetingMessageId: null,
    createdAt: now,
  };
  await deps.trips.save(trip);
  const meetingMessageId = await deps.announce(trip);
  if (meetingMessageId !== null) await deps.trips.save({ ...trip, meetingMessageId });
  await deps.changed(trip.id, 'published');
  return { ok: true, value: tripView(trip, driver, car, now, NO_RIDERS, undefined, recommended) };
}
