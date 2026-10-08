import {
  arrivalAt,
  MINUTE_MS,
  RETURN_REST_MS,
  SLOT_MINUTES,
  tashkentDate,
  tashkentDayStart,
  tashkentTime,
  type Trip,
} from '@platform/contracts';
import type { PlaceDirectory } from '../places/directory';
import { returnDraft } from '../market/return-trip';
import type { TripDraft } from '../market/trip-draft';

const SLOT_MS = SLOT_MINUTES * MINUTE_MS;

// The way back on the given day: at the time of the arrival and the rest, on a slot of the
// publishing (G38); the driver confirms or changes it there.
export function returnDepartAt(trip: Pick<Trip, 'departAt' | 'km'>, day: string): number {
  const back = arrivalAt(trip.departAt, trip.km) + RETURN_REST_MS;
  const inDay = back - tashkentDayStart(tashkentDate(back));
  return tashkentDayStart(day) + Math.ceil(inDay / SLOT_MS) * SLOT_MS;
}

// The draft of the publishing for the way back (docs/40, question 43): the route the other way with
// the same seats, price and rules (returnDraft), and the day and the time of «Qaytish».
export function returnTripDraft(trip: Trip, directory: PlaceDirectory, departAt: number) {
  const from = directory.find(trip.from);
  const to = directory.find(trip.to);
  if (!from || !to) return null;
  const date = tashkentDate(departAt);
  const time = tashkentTime(departAt);
  const published: TripDraft = {
    route: { from, to },
    pickupMode: trip.pickupMode,
    date: tashkentDate(trip.departAt),
    time: tashkentTime(trip.departAt),
    departAt: trip.departAt,
    seats: trip.seats,
    price: trip.price,
    womanOnBoard: trip.woman,
    bookingRule: trip.bookingRule,
    comment: trip.comment,
  };
  return { ...returnDraft(published), date, time, departAt };
}
