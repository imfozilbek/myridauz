import { commonModes, COUNTED_DAYS, extraKm, FAR_EXTRA_KM, type Stops, type Trip } from '@platform/contracts';
import type { RequestRecord } from './ride-request';

type TripFacts = Pick<Trip, 'from' | 'to' | 'seats' | 'seatsLeft' | 'bookingRule' | 'pickupMode'>;

// Does a request fit the trip of the driver (G64, «Safaringizga mos»)? The same regions both ways,
// the seats as a booking takes them (the whole car only on an empty trip that allows it), a common
// way of picking up (docs/70), at most FAR_EXTRA_KM of extra way. The extra km when it fits, else null.
export function tripFit(
  trip: TripFacts,
  stops: Stops,
  request: RequestRecord,
  regionOf: (placeId: string) => string,
): number | null {
  if (regionOf(request.from) !== regionOf(trip.from) || regionOf(request.to) !== regionOf(trip.to))
    return null;
  const seats = request.wholeCar
    ? trip.bookingRule !== 'seats' && trip.seatsLeft === trip.seats
    : trip.bookingRule !== 'car_only' && trip.seatsLeft >= request.seats;
  if (!seats || commonModes(trip.pickupMode, request.pickupMode).length === 0) return null;
  const extra = extraKm(stops, { pickup: request.pickup, dropoff: request.dropoff });
  return extra <= FAR_EXTRA_KM ? extra : null;
}

// The row of the week (owner decision 12.10.2026, docs/172): today and the six days after it, each
// with its count; a request goes no further (docs/127).
export function boardDays(dates: readonly string[], today: string, nextDay: (date: string) => string) {
  const week = [today];
  while (week.length < COUNTED_DAYS) week.push(nextDay(week[week.length - 1] ?? today));
  return week.map((date) => ({ date, count: dates.filter((day) => day === date).length }));
}
