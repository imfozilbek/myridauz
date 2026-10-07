import type { Share, SharedTrip } from '@platform/contracts';
import { driverShareStatus, openUntil } from '../domain/share';
import { issueLink, tellAll } from './links';
import type { DriverTrip, Result, SharesDeps } from './ports';

// The driver shares a trip with the family (docs/43, G18): the same card, the same follow screen.
export async function createDriverShare(
  deps: SharesDeps,
  driverId: number,
  tripId: string,
): Promise<Result<Share, 'shares.not_found' | 'shares.wrong_status'>> {
  const trip = await deps.driverTrip(tripId);
  if (trip?.driverId !== driverId) return { ok: false, error: 'shares.not_found' };
  const status = driverShareStatus(trip, deps.now());
  if (status === 'cancelled' || status === 'completed') return { ok: false, error: 'shares.wrong_status' };
  const text = await deps.texts.driverCard(trip);
  return { ok: true, value: await issueLink(deps, { kind: 'trip', id: tripId }, driverId, text) };
}

export async function stopDriverSharing(deps: SharesDeps, driverId: number, tripId: string) {
  const trip = await deps.driverTrip(tripId);
  if (trip?.driverId !== driverId) return false;
  await deps.shares.revoke({ kind: 'trip', id: tripId }, deps.now());
  return true;
}

// What the family sees: the driver's first name, the car and the plate; never a phone (docs/07).
export function driverShared(trip: DriverTrip, followers: number, now: number): SharedTrip | null {
  if (now > openUntil(trip.departAt, trip.km)) return null;
  return {
    passengerName: trip.driverName,
    from: trip.from,
    to: trip.to,
    departAt: trip.departAt,
    firstDepartAt: trip.departAt,
    km: trip.km,
    driver: { firstName: trip.driverName, car: trip.car },
    plate: trip.plate,
    // The driver takes many people: no single meeting place to show (docs/70).
    meetingPoint: null,
    dropoffPoint: null,
    status: driverShareStatus(trip, now),
    followers,
  };
}

// A cancelled trip: the family hears it once, then the links close.
export async function tellTripCancelled(deps: SharesDeps, tripId: string) {
  const subject = { kind: 'trip' as const, id: tripId };
  await tellAll(deps, subject, deps.texts.cancelled());
  await deps.shares.revoke(subject, deps.now());
}
