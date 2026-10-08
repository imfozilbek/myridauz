import { DEPART_EARLY_MS, onTheWay } from '@platform/contracts';
import { isLive, type TripRecord } from './trip';

export type DepartError =
  'trips.not_found' | 'trips.wrong_status' | 'trips.too_early_to_depart' | 'trips.already_departed';
export type ArriveError =
  'trips.not_found' | 'trips.wrong_status' | 'trips.not_departed' | 'trips.already_arrived';

// Only the driver of a live trip moves it on (docs/35): a cancelled or completed one stays as it is.
const closed = (trip: TripRecord, driverId: number, now: number) => {
  if (trip.driverId !== driverId) return 'trips.not_found';
  return isLive(trip, now) ? null : 'trips.wrong_status';
};

// «Yoʻlga chiqdim» (G63, owner decision 06.10.2026): from an hour before the time, once. The trip
// keeps its status: the mark makes it «on the road» for every rule (onTheWay).
export function depart(trip: TripRecord, driverId: number, now: number): TripRecord | DepartError {
  const error = closed(trip, driverId, now);
  if (error) return error;
  if (trip.departedAt !== null) return 'trips.already_departed';
  if (now < trip.departAt - DEPART_EARLY_MS) return 'trips.too_early_to_depart';
  return { ...trip, departedAt: now };
}

// «Yetib keldik»: only on the road, once. Without «Yoʻlga chiqdim» the time of the trip counts as
// the departure. The deadlines after the trip stay as they were: they count from its end (docs/129).
export function arrive(trip: TripRecord, driverId: number, now: number): TripRecord | ArriveError {
  const error = closed(trip, driverId, now);
  if (error) return error;
  if (trip.arrivedAt !== null) return 'trips.already_arrived';
  if (!onTheWay(trip, now)) return 'trips.not_departed';
  return { ...trip, departedAt: trip.departedAt ?? trip.departAt, arrivedAt: now };
}
