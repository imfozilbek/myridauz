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
import type { TripAgain } from '../market/trip-draft';
import type { PlaceDirectory } from '../places/directory';
import type { Route } from '../places/route-screen';

const SLOT_MS = SLOT_MINUTES * MINUTE_MS;

// The way back as the one screen of the publishing takes it (G63 C1): its route and its answers.
export type ReturnTrip = { readonly route: Route; readonly again: TripAgain };

// The way back on the given day: at the time of the arrival and the rest, on a slot of the
// publishing (G38); the driver confirms or changes it there.
export function returnDepartAt(trip: Pick<Trip, 'departAt' | 'km'>, day: string): number {
  const back = arrivalAt(trip.departAt, trip.km) + RETURN_REST_MS;
  const inDay = back - tashkentDayStart(tashkentDate(back));
  return tashkentDayStart(day) + Math.ceil(inDay / SLOT_MS) * SLOT_MS;
}

// «Qaytish» (docs/40, question 43): the route the other way with the same seats, price, the rule of
// the salon (G61) and the way of taking people; a new comment; the day and the time of the way back.
// «Mashinada ayol bor» starts off: trip.woman is also true for a woman passenger (docs/06 safety).
// Null while a place of the trip is unknown.
export const returnTrip = (trip: Trip, directory: PlaceDirectory, departAt: number) =>
  tripPlan(trip, directory, departAt, true);

// «Ertaga shu safar» (G64, mockup g64/6): the same trip the same way on another day, with the same
// answers as the way back takes them.
export const sameTrip = (trip: Trip, directory: PlaceDirectory, departAt: number) =>
  tripPlan(trip, directory, departAt, false);

function tripPlan(trip: Trip, directory: PlaceDirectory, departAt: number, back: boolean): ReturnTrip | null {
  const from = directory.find(trip.from);
  const to = directory.find(trip.to);
  if (!from || !to) return null;
  const again: TripAgain = {
    pickupMode: trip.pickupMode,
    seats: trip.seats,
    price: trip.price,
    womanOnBoard: false,
    bookingRule: trip.bookingRule,
    comment: '',
    date: tashkentDate(departAt),
    time: tashkentTime(departAt),
  };
  return { route: back ? { from: to, to: from } : { from, to }, again };
}
