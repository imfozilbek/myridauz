import { DEPART_AUTO_MS, DEPART_REMIND_MS } from '@platform/contracts';
import { TICK_MINUTES } from '../../../shared/cron/tick';

// A live trip without «Yoʻlga chiqdim» (G63): whom to ask and when it should have left.
export type LateTrip = { readonly id: string; readonly driverId: number; readonly departAt: number };

export type DepartureDeps = {
  // Live trips without «Yoʻlga chiqdim» whose time is in [from, to] (the index of depart_at).
  readonly late: (from: number, to: number) => Promise<readonly LateTrip[]>;
  readonly depart: (tripId: string, at: number) => Promise<void>;
  // True the first time a key is seen: the driver is asked once.
  readonly first: (key: string) => Promise<boolean>;
  readonly remind: (trip: LateTrip) => Promise<void>;
  readonly now: () => number;
};

// One more tick in the window: a late or failed tick misses no trip.
const TICK_MS = TICK_MINUTES * 60 * 1000;

// The Cron job (docs/35, owner decision 06.10.2026): no «Yoʻlga chiqdim» an hour after the time, the
// driver bot asks once; two hours after the time the trip is on the road by itself.
export async function watchDepartures(deps: DepartureDeps): Promise<void> {
  const now = deps.now();
  for (const trip of await deps.late(now - DEPART_AUTO_MS - TICK_MS, now - DEPART_REMIND_MS)) {
    if (now >= trip.departAt + DEPART_AUTO_MS) await deps.depart(trip.id, now);
    else if (await deps.first(`${trip.id}:depart`)) await deps.remind(trip);
  }
}
