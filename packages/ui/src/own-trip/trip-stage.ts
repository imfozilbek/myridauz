import type { Trip } from '@platform/contracts';

const MINUTE_MS = 60 * 1000;
// «Yoʻlga chiqdim» shows from this long before the departure (docs/118 path 6, Claude's advice).
const DEPART_BUTTON_MS = 60 * MINUTE_MS;

export type TripStage = 'published' | 'soon' | 'on_way' | 'over';
export type TripStep = 'departed' | 'arrived';
type Timed = Pick<Trip, 'departAt' | 'status'>;

// Where the own trip is (mockup g63/3): published, the hour before the departure, on the way, over.
// departedAt is the moment the driver tapped «Yoʻlga chiqdim»: null before it. Left out, the
// departure time stands for that moment.
export function tripStage(trip: Timed, now: number, departedAt?: number | null): TripStage {
  if (trip.status === 'completed' || trip.status === 'cancelled') return 'over';
  const departed = departedAt === undefined ? now >= trip.departAt : departedAt !== null;
  if (departed) return 'on_way';
  return now >= trip.departAt - DEPART_BUTTON_MS ? 'soon' : 'published';
}

// The main button of each stage: none until the hour before, «Yoʻlga chiqdim», then «Yetib keldik».
export const STEP_OF: Readonly<Record<TripStage, TripStep | null>> = {
  published: null,
  soon: 'departed',
  on_way: 'arrived',
  over: null,
};

// «Joʻnashga N daqiqa»: whole minutes up, never below zero.
export const minutesLeft = (trip: Timed, now: number) =>
  Math.max(0, Math.ceil((trip.departAt - now) / MINUTE_MS));
