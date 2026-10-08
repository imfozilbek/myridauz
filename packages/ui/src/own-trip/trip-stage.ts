import { DEPART_EARLY_MS, MINUTE_MS, onTheWay, tripEndsAt, type Trip } from '@platform/contracts';

export type TripStage = 'published' | 'soon' | 'on_way' | 'over';
export type TripStep = 'departed' | 'arrived';
type Timed = Pick<Trip, 'departAt' | 'km' | 'status' | 'departedAt' | 'arrivedAt'>;

// Past for its driver (lead decision 08.10.2026): «Yetib keldik» went through or the server closed
// the trip. The past trip opens at once; the deadlines after it still count from its end (docs/129).
export const tripPast = (trip: Pick<Trip, 'status' | 'arrivedAt'>) =>
  trip.status === 'completed' || trip.arrivedAt !== null;

// Over: past, cancelled, or its time ended, when the server closes it by itself (docs/35): the page
// never offers a step the server refuses, even before the list is fresh.
const over = (trip: Timed, now: number) =>
  tripPast(trip) || trip.status === 'cancelled' || now >= tripEndsAt(trip.departAt, trip.km);
// «Yoʻlga chiqdim» works from DEPART_EARLY_MS before the time of the trip, as on the server.
const hourBefore = (trip: Timed, now: number) => now >= trip.departAt - DEPART_EARLY_MS;

// Where the own trip is (mockup g63/3): published, the hour before the departure, on the way, over.
// On the way by the rule of the server (onTheWay): no cancel or change the server refuses.
export function tripStage(trip: Timed, now: number): TripStage {
  if (over(trip, now)) return 'over';
  if (onTheWay(trip, now)) return 'on_way';
  return hourBefore(trip, now) ? 'soon' : 'published';
}

// The main button: nothing until the hour before, then «Yoʻlga chiqdim» until the driver taps it
// (the time alone does not), then «Yetib keldik».
export function tripStep(trip: Timed, now: number): TripStep | null {
  if (over(trip, now)) return null;
  if (trip.departedAt !== null) return 'arrived';
  return hourBefore(trip, now) ? 'departed' : null;
}

// «Joʻnashga N daqiqa» before the time of the trip: whole minutes up.
export const minutesLeft = (trip: Timed, now: number) => Math.ceil((trip.departAt - now) / MINUTE_MS);
