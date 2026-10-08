import { commonModes, onTheWay, tashkentDate, type Car, type OfferInput } from '@platform/contracts';
import { seatChoiceError } from '../domain/seat-choice';
import type { BookingsDeps, Result } from './ports';
import type { RequestFacts } from './request-facts';

export type PlanError =
  | 'bookings.not_found'
  | 'bookings.invalid_input'
  | 'bookings.no_seats'
  | 'bookings.salon_taken'
  | 'bookings.departed'
  | 'bookings.wrong_mode'
  | 'bookings.outside_area'
  | 'trips.price_out_of_bounds'
  | 'trips.too_many'
  | 'trips.too_soon'
  | 'trips.busy';
// What the offer promises: the time, the price of a seat and the seats.
type Plan = { readonly departAt: number; readonly price: number; readonly seats: number };

// A time and a price of the driver (docs/35): on the request's day, in the future, within the bounds;
// an accepted offer is a new trip, so the driver hears the schedule now (docs/103).
export async function newTripPlan(
  deps: BookingsDeps,
  driverId: number,
  request: RequestFacts,
  input: Required<Omit<OfferInput, 'tripId'>>,
  car: Car,
): Promise<Result<Plan, PlanError>> {
  if (input.departAt <= deps.now() || tashkentDate(input.departAt) !== request.date)
    return { ok: false, error: 'bookings.invalid_input' };
  const recommendation = await deps.recommend(request.from, request.to);
  if (!recommendation.ok) return { ok: false, error: 'bookings.not_found' };
  const { km, minPrice, maxPrice } = recommendation.value;
  if (input.price < minPrice || input.price > maxPrice)
    return { ok: false, error: 'trips.price_out_of_bounds' };
  const busy = await deps.trips.scheduleError(driverId, { ...request, departAt: input.departAt, km });
  if (busy) return { ok: false, error: busy };
  // The whole car is every seat of this car, priced per seat (docs/09).
  return { ok: true, value: { ...input, seats: request.wholeCar ? car.seats : request.seats } };
}

// «Safarimga taklif qilish» (G64): the time and the price are the trip's; the seats, the way and the
// points of the request must fit the trip as a booking would (docs/70, docs/118).
export async function ownTripPlan(
  deps: BookingsDeps,
  driverId: number,
  request: RequestFacts,
  tripId: string,
): Promise<Result<Plan, PlanError>> {
  const [facts, [trip]] = await Promise.all([deps.trips.find(tripId), deps.trips.views([tripId])]);
  if (!facts?.live || !trip || facts.driverId !== driverId) return { ok: false, error: 'bookings.not_found' };
  if (onTheWay(facts, deps.now())) return { ok: false, error: 'bookings.departed' };
  if (tashkentDate(trip.departAt) !== request.date) return { ok: false, error: 'bookings.invalid_input' };
  const seats = request.wholeCar ? trip.seats : request.seats;
  const choice = seatChoiceError(trip, { seats, wholeCar: request.wholeCar, withWoman: false });
  if (choice === 'bookings.no_seats' && request.wholeCar) return { ok: false, error: 'bookings.salon_taken' };
  if (choice) return { ok: false, error: choice };
  if (trip.seatsLeft < seats) return { ok: false, error: 'bookings.no_seats' };
  if (commonModes(trip.pickupMode, request.pickupMode).length === 0)
    return { ok: false, error: 'bookings.wrong_mode' };
  const outside =
    (request.pickup !== null && !deps.places.fits(request.pickup, trip.from)) ||
    (request.dropoff !== null && !deps.places.fits(request.dropoff, trip.to));
  if (outside) return { ok: false, error: 'bookings.outside_area' };
  return { ok: true, value: { departAt: trip.departAt, price: trip.price, seats } };
}
