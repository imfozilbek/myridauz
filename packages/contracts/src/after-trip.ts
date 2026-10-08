import { AFTER_TRIP_TALK_HOURS } from './chat';
import { COMPLAIN_DAYS } from './complaints';
import { RATING_DAYS } from './ratings';
import { DAY_MS, HOUR_MS } from './tashkent-time';
import { arrivalAt } from './trips';

// A trip closes by itself this long after the arrival (docs/35, docs/129).
const CLOSES_AFTER_MS = 2 * HOUR_MS;
// The exact points live this long after the trip (docs/69): enough for a complaint (docs/17).
export const POINTS_KEEP_DAYS = 30;

// The end of a trip: the arrival and two hours more; the deadlines after the trip count from it.
export const tripEndsAt = (departAt: number, km: number) => arrivalAt(departAt, km) + CLOSES_AFTER_MS;

// What a person may still do after the trip, and until when (docs/129): the server checks the same.
export function afterTrip(departAt: number, km: number) {
  const end = tripEndsAt(departAt, km);
  return {
    talkUntil: arrivalAt(departAt, km) + AFTER_TRIP_TALK_HOURS * HOUR_MS,
    rateUntil: end + RATING_DAYS * DAY_MS,
    complainUntil: end + COMPLAIN_DAYS * DAY_MS,
    pointsUntil: end + POINTS_KEEP_DAYS * DAY_MS,
  };
}
