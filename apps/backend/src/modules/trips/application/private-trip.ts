import type { Trip } from '@platform/contracts';
import { isLive } from '../domain/trip';
import { offerWay } from './direction-pitak';
import type { Result, TripsDeps } from './ports';
import { publishTrip, type Input, type PublishError } from './publish';
import { views } from './views-of';

// «Safar ochib taklif qilish» (G64, docs/118 path 7): the trip of one «Boʻsh salon kerak» request.
// «Uyidan yoki pitakdan» of the passenger takes the way of the direction (docs/70).
export async function publishPrivateTrip(
  deps: TripsDeps,
  driverId: number,
  input: Input,
  requestId: string,
): Promise<Result<Trip, PublishError>> {
  const pickupMode =
    input.pickupMode === 'both' ? await offerWay(deps, input.from, input.to) : input.pickupMode;
  return publishTrip(deps, driverId, { ...input, pickupMode }, requestId);
}

// The passenger said no or did not answer: the driver opens the trip for everybody (G64), as if it
// were published now: the channels, the subscribers and the saved drivers hear of it.
export async function openTrip(
  deps: TripsDeps,
  driverId: number,
  id: string,
): Promise<Result<Trip, 'trips.not_found' | 'trips.wrong_status'>> {
  const trip = await deps.trips.find(id);
  if (trip?.driverId !== driverId) return { ok: false, error: 'trips.not_found' };
  if (trip.forRequest === null || !isLive(trip, deps.now()))
    return { ok: false, error: 'trips.wrong_status' };
  const opened = { ...trip, forRequest: null };
  await deps.trips.save(opened);
  await deps.announce(opened);
  await deps.changed(id, 'published');
  const [view] = await views(deps, [opened]);
  return view ? { ok: true, value: view } : { ok: false, error: 'trips.not_found' };
}

// The passenger took the whole car: the trip is an ordinary full one, nothing to announce (G64).
export async function releaseTrip(deps: TripsDeps, id: string): Promise<void> {
  const trip = await deps.trips.find(id);
  if (trip && trip.forRequest !== null) await deps.trips.save({ ...trip, forRequest: null });
}
