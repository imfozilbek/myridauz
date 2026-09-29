import { arrivalAt, DAY_MS, TRIP_DAYS_AHEAD, type Trip } from '@platform/contracts';

// A published trip (docs/35). The price stays as published: a new formula is only for new trips (docs/23).
export type TripRecord = {
  readonly id: string;
  readonly driverId: number;
  readonly from: string;
  readonly to: string;
  readonly departAt: number;
  // departAt + time on the road + 2 hours: then the trip is completed by itself (docs/35).
  readonly endsAt: number;
  readonly km: number;
  readonly seats: number;
  readonly price: number;
  readonly womanOnBoard: boolean;
  readonly comment: string;
  readonly status: Trip['status'];
  readonly meetingPoint: { readonly lat: number; readonly lng: number } | null;
  // The driver bot message the driver answers with the meeting point (docs/14).
  readonly meetingMessageId: number | null;
  readonly createdAt: number;
};

const AFTER_ARRIVAL_MS = 2 * 60 * 60 * 1000;

export const endsAt = (departAt: number, km: number) => arrivalAt(departAt, km) + AFTER_ARRIVAL_MS;

// The time of a new trip: in the future and not too far (docs/35).
export function departError(departAt: number, now: number): 'trips.in_past' | 'trips.invalid_input' | null {
  if (departAt <= now) return 'trips.in_past';
  return departAt > now + TRIP_DAYS_AHEAD * DAY_MS ? 'trips.invalid_input' : null;
}

// Active or full and not over yet: it counts for the limit of 5 and shows in the search.
export const isLive = (trip: TripRecord, now: number) =>
  (trip.status === 'active' || trip.status === 'full') && trip.endsAt > now;

// What the driver sees now, even before the Cron job has marked an old trip completed.
export const statusAt = (trip: TripRecord, now: number): Trip['status'] =>
  (trip.status === 'active' || trip.status === 'full') && trip.endsAt <= now ? 'completed' : trip.status;

// Only the driver cancels, only a trip that is not over (docs/35).
export function cancel(
  trip: TripRecord,
  driverId: number,
  now: number,
): TripRecord | 'trips.not_found' | 'trips.wrong_status' {
  if (trip.driverId !== driverId) return 'trips.not_found';
  return isLive(trip, now) ? { ...trip, status: 'cancelled' } : 'trips.wrong_status';
}
