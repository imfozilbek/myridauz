import { commonModes, extraKm, FAR_EXTRA_KM, type Stops, type Trip } from '@platform/contracts';
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

// The day buttons (G64): today, tomorrow and the next day that has requests, else the day after
// tomorrow; each with its count.
export function boardDays(dates: readonly string[], today: string, nextDay: (date: string) => string) {
  const tomorrow = nextDay(today);
  const later = dates.filter((date) => date > tomorrow).sort()[0] ?? nextDay(tomorrow);
  return [today, tomorrow, later].map((date) => ({
    date,
    count: dates.filter((day) => day === date).length,
  }));
}
