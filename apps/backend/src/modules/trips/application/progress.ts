import type { Trip } from '@platform/contracts';
import type { TripRecord } from '../domain/trip';
import { arrive, depart, type ArriveError, type DepartError } from '../domain/trip-progress';
import type { Result, TripsDeps } from './ports';
import { views } from './views-of';

type Step<E extends string> = (trip: TripRecord, driverId: number, now: number) => TripRecord | E;
type Write = (id: string, at: number) => Promise<boolean>;

// One step of the driver (G63, docs/35): the rule on the trip as it was read, then one conditional
// write. A cancel or the Cron that came between them wins: the step is refused with the reason of now.
async function move<E extends string>(
  deps: TripsDeps,
  driverId: number,
  id: string,
  step: Step<E>,
  write: Write,
): Promise<Result<TripRecord, E | 'trips.not_found' | 'trips.wrong_status'>> {
  const trip = await deps.trips.find(id);
  if (!trip) return { ok: false, error: 'trips.not_found' };
  const now = deps.now();
  const next = step(trip, driverId, now);
  if (typeof next === 'string') return { ok: false, error: next };
  if (await write(id, now)) return { ok: true, value: next };
  const current = await deps.trips.find(id);
  const again = current ? step(current, driverId, deps.now()) : 'trips.not_found';
  return { ok: false, error: typeof again === 'string' ? again : 'trips.wrong_status' };
}

// The driver and the riders with a confirmed seat see the new state on their open screens (docs/64).
async function shown(deps: TripsDeps, trip: TripRecord): Promise<Result<Trip, 'trips.not_found'>> {
  const riders = await deps.riders([trip.id]);
  await deps.signal([
    { userId: trip.driverId, app: 'driver' },
    ...riders.map((rider) => ({ userId: rider.passengerId, app: 'passenger' as const })),
  ]);
  const [view] = await views(deps, [trip]);
  return view ? { ok: true, value: view } : { ok: false, error: 'trips.not_found' };
}

// «Yoʻlga chiqdim»: the channel posts stop offering seats at once (docs/15).
export async function departTrip(deps: TripsDeps, driverId: number, id: string) {
  const moved = await move<DepartError>(deps, driverId, id, depart, (tripId, at) =>
    deps.trips.depart(tripId, at),
  );
  if (!moved.ok) return moved;
  await deps.changed(id, 'departed');
  return shown(deps, moved.value);
}

// «Yetib keldik»: the deadlines after the trip stay as they were (docs/129); the trip card of the
// driver bot leaves the top of the chat (G68).
export async function arriveTrip(deps: TripsDeps, driverId: number, id: string) {
  const moved = await move<ArriveError>(deps, driverId, id, arrive, (tripId, at) =>
    deps.trips.arrive(tripId, at),
  );
  if (!moved.ok) return moved;
  await deps.changed(id, 'arrived');
  return shown(deps, moved.value);
}
