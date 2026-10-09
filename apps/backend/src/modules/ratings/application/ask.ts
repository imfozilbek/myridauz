import { DAY_MS, RATING_DAYS, RATING_REMIND_HOURS } from '@platform/contracts';
import type { Ask, AskedAt, RatingsDeps, Ride } from './ports';

const HOUR_MS = 60 * 60 * 1000;
// The rides that ended in the last two days get the first ask: each ride is asked once, and two
// days cover the hours the Cron did not run, without reading two weeks of trips each time (G56).
const ASK_WINDOW_MS = 2 * DAY_MS;
const raterRole = (ride: Ride, raterId: number): AskedAt['rater'] =>
  raterId === ride.driverId ? 'driver' : 'passenger';

// The Cron job (docs/24): after a ride both sides get "Safar qanday oʻtdi?" once, with 1 … 5;
// who has not answered in RATING_REMIND_HOURS gets one reminder; after RATING_DAYS nothing more.
export async function askRatings(deps: RatingsDeps): Promise<void> {
  const now = deps.now();
  const rides = await deps.rides.ended(now - ASK_WINDOW_MS, now);
  const asked = await deps.store.askedBookings(rides.map((ride) => ride.bookingId));
  const fresh = rides.filter((ride) => !asked.has(ride.bookingId));
  const asks = fresh.flatMap((ride): Ask[] => [
    { bookingId: ride.bookingId, raterId: ride.passengerId, rateeId: ride.driverId, askedAt: now },
    { bookingId: ride.bookingId, raterId: ride.driverId, rateeId: ride.passengerId, askedAt: now },
  ]);
  if (asks.length > 0) await deps.store.saveAsks(asks);
  const byBooking = new Map(fresh.map((ride) => [ride.bookingId, ride]));
  await send(deps, asks, (ask) => byBooking.get(ask.bookingId), false);
  const due = await deps.store.toRemind(now - RATING_REMIND_HOURS * HOUR_MS, now - RATING_DAYS * DAY_MS);
  for (const ask of due) await deps.store.markReminded(ask);
  const remindRides = new Map<string, Ride | undefined>();
  for (const ask of due) remindRides.set(ask.bookingId, await deps.rides.find(ask.bookingId));
  await send(deps, due, (ask) => remindRides.get(ask.bookingId), true);
}

async function send(
  deps: RatingsDeps,
  asks: readonly Ask[],
  rideOf: (ask: Ask) => Ride | undefined,
  reminder: boolean,
): Promise<void> {
  if (asks.length === 0) return;
  const names = await deps.names([...new Set(asks.map((ask) => ask.rateeId))]);
  for (const ask of asks) {
    const ride = rideOf(ask);
    const at = ride && { rater: raterRole(ride, ask.raterId), tripId: ride.tripId };
    if (at) await deps.ask(ask, names.get(ask.rateeId) ?? '', at, reminder);
  }
}
