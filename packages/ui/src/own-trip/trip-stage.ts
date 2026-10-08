import type { Trip } from '@platform/contracts';

const MINUTE_MS = 60 * 1000;
// «Yoʻlga chiqdim» works from an hour before the time of the trip (docs/35). The server keeps the
// same rule as DEPART_EARLY_MS and onTheWay of @platform/contracts (G63 B1).
const DEPART_EARLY_MS = 60 * MINUTE_MS;

export type TripStage = 'published' | 'soon' | 'on_way' | 'over';
export type TripStep = 'departed' | 'arrived';
// The marks «Yoʻlga chiqdim» and «Yetib keldik» come with the trip from G63 B1: a trip without
// them has neither, and its time alone puts it on the road, as on the server.
type Timed = Pick<Trip, 'departAt' | 'status'> & {
  readonly departedAt?: number | null;
  readonly arrivedAt?: number | null;
};

const marked = (at: number | null | undefined) => typeof at === 'number';
const over = (trip: Timed) =>
  trip.status === 'completed' || trip.status === 'cancelled' || marked(trip.arrivedAt);
const hourBefore = (trip: Timed, now: number) => now >= trip.departAt - DEPART_EARLY_MS;

// On the road: the driver tapped «Yoʻlga chiqdim», or the time of the trip came. The rule of the
// server, so the page never offers a cancel or a change the server refuses.
const onTheWay = (trip: Timed, now: number) => marked(trip.departedAt) || now >= trip.departAt;

// Where the own trip is (mockup g63/3): published, the hour before the departure, on the way, over.
export function tripStage(trip: Timed, now: number): TripStage {
  if (over(trip)) return 'over';
  if (onTheWay(trip, now)) return 'on_way';
  return hourBefore(trip, now) ? 'soon' : 'published';
}

// The main button: nothing until the hour before, then «Yoʻlga chiqdim» until the driver taps it
// (the time alone does not), then «Yetib keldik».
export function tripStep(trip: Timed, now: number): TripStep | null {
  if (over(trip)) return null;
  if (marked(trip.departedAt)) return 'arrived';
  return hourBefore(trip, now) ? 'departed' : null;
}

// «Joʻnashga N daqiqa» before the time of the trip: whole minutes up.
export const minutesLeft = (trip: Timed, now: number) => Math.ceil((trip.departAt - now) / MINUTE_MS);
