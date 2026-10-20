import { lastDepart } from './depart-range';
import { DAY_MS, HOUR_MS } from './tashkent-time';
import { arrivalAt } from './trips';

// A trip closes by itself this long after the arrival (docs/35, docs/129).
const CLOSES_AFTER_MS = 2 * HOUR_MS;
// The exact points live this long after the trip (docs/69): enough for a complaint (docs/17).
export const POINTS_KEEP_DAYS = 30;

// The times of a trip the rules after its departure read: a range counts from its last hour (docs/216).
export type TripTiming = {
  readonly departAt: number;
  readonly departUntil: number | null;
  readonly km: number;
};

// The arrival the rules expect: the road from the last departure.
export const tripArrival = (trip: TripTiming) => arrivalAt(lastDepart(trip), trip.km);
// The end of a trip: the arrival and two hours more; the deadlines after the trip count from it.
export const tripEndsAt = (trip: TripTiming) => tripArrival(trip) + CLOSES_AFTER_MS;
// «Yetib keldingizmi?» an hour after the arrival without «Yetib keldim» (docs/43, docs/129): the
// sheet of the main screen and the passenger bot (G46).
const ASK_ARRIVED_AFTER_MS = HOUR_MS;
export const arrivedAskAt = (trip: TripTiming) => tripArrival(trip) + ASK_ARRIVED_AFTER_MS;
// The question comes this long before the end of the trip: the trips that end in a window ask.
export const ARRIVED_ASK_BEFORE_END_MS = CLOSES_AFTER_MS - ASK_ARRIVED_AFTER_MS;

// The deadlines after a trip in the brand config, with the owner's values (docs/128 §4): the chat and
// the call stay afterTripHours from the arrival, then read only (a forgotten thing and «rahmat», not a
// deal past Rida); a rating and a complaint are taken their days after the end (docs/129).
export type AfterTripRules = {
  readonly chat: { readonly afterTripHours: number };
  readonly ratings: { readonly days: number };
  readonly complaints: { readonly days: number };
};

// What a person may still do after the trip, and until when (docs/129): the server checks the same.
// The day of writing counts from «Yetib keldik» when the car came (mockup g63/5 phone 5).
export function afterTrip(rules: AfterTripRules, trip: TripTiming & { readonly arrivedAt?: number | null }) {
  const end = tripEndsAt(trip);
  return {
    talkUntil: (trip.arrivedAt ?? tripArrival(trip)) + rules.chat.afterTripHours * HOUR_MS,
    rateUntil: end + rules.ratings.days * DAY_MS,
    complainUntil: end + rules.complaints.days * DAY_MS,
    pointsUntil: end + POINTS_KEEP_DAYS * DAY_MS,
  };
}
