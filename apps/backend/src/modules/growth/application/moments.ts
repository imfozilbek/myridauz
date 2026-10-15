import {
  botStartLink,
  DAY_MS,
  loopVia,
  momentLoop,
  routeFindLink,
  type Moment,
  type ShareMoment,
} from '@platform/contracts';
import type { GrowthDeps, Ride, Side } from './ports';

// A moment is offered while it is fresh: right after it, never months later (docs/123).
const FRESH_DAYS = 7;
const JOIN_FRESH_DAYS = 1;
// The marks of «Men Rida bilan», the highest first: a count past several marks offers the highest.
const TRIP_MARKS = [
  [25, 'trip25'],
  [10, 'trip10'],
  [5, 'trip5'],
  [1, 'trip1'],
] as const satisfies readonly (readonly [number, ShareMoment])[];
const RIDER_MARKS = [
  [100, 'riders100'],
  [50, 'riders50'],
  [10, 'riders10'],
] as const satisfies readonly (readonly [number, ShareMoment])[];

const reached = (count: number, marks: readonly (readonly [number, ShareMoment])[]) =>
  marks.find(([mark]) => count >= mark)?.[1] ?? null;

const lastOf = (rides: readonly Ride[]) =>
  rides.reduce<Ride | null>((last, ride) => (!last || ride.departAt > last.departAt ? ride : last), null);

// One moment, one offer (docs/123): offering a mark offers the lower marks of its row with it.
export function offeredWith(moment: ShareMoment): ShareMoment[] {
  const row = [TRIP_MARKS, RIDER_MARKS].find((marks) => marks.some(([, id]) => id === moment));
  if (!row) return [moment];
  const at = row.findIndex(([, id]) => id === moment);
  return row.slice(at).map(([, id]) => id);
}

// The highest moment a person reached on a side while it is fresh; null: none now.
export async function reachedMoment(deps: GrowthDeps, userId: number, side: Side, rides: readonly Ride[]) {
  const fresh = (at: number | null | undefined, days: number) =>
    at !== null && at !== undefined && deps.now() - at <= days * DAY_MS;
  const last = lastOf(rides);
  if (side === 'passenger') {
    if (last && fresh(last.departAt, FRESH_DAYS)) return reached(rides.length, TRIP_MARKS);
    return rides.length === 0 && fresh(await deps.joinedAt(userId), JOIN_FRESH_DAYS) ? 'join' : null;
  }
  const riders = rides.reduce((sum, ride) => sum + ride.seats, 0);
  if (last && fresh(last.departAt, FRESH_DAYS)) {
    const mark = reached(riders, RIDER_MARKS);
    if (mark) return mark;
  }
  return fresh(await deps.store.approvedAt(userId), FRESH_DAYS) ? 'driver' : null;
}

// The true facts of a moment's card (docs/123: praise only from the data, lesson 9): the route of the
// last trip, the people in the car or brought to their places, the links with the author's code.
export type Facts = Moment & { readonly joinLink: string };

export async function momentFacts(
  deps: GrowthDeps,
  userId: number,
  moment: ShareMoment | null,
  rides: readonly Ride[],
): Promise<Facts> {
  const last = lastOf(rides);
  const route = last ? { from: last.from, to: last.to } : null;
  const people = !moment
    ? 0
    : moment.startsWith('trip') && last
      ? (await deps.store.riders(last.tripId)) + 1
      : moment.startsWith('riders')
        ? rides.reduce((sum, ride) => sum + ride.seats, 0)
        : 0;
  const via = loopVia(moment ? momentLoop(moment) : 'share-join', await deps.store.codeOf(userId));
  const joinLink = botStartLink(deps.passengerBot, via);
  // A trip leads to the search of its direction; a new person to the start of the bot (docs/123).
  const link =
    route && moment !== 'join' ? routeFindLink(deps.passengerBot, route.from, route.to, via) : joinLink;
  return { moment, route, people, link, joinLink };
}

// The moment a person reached and was not offered yet, with the facts of its card.
export async function dueMoment(deps: GrowthDeps, userId: number, side: Side): Promise<Facts> {
  const [offered, rides] = await Promise.all([deps.store.offered(userId), deps.rides(userId, side)]);
  const found = await reachedMoment(deps, userId, side, rides);
  return momentFacts(deps, userId, found && !offered.includes(found) ? found : null, rides);
}
