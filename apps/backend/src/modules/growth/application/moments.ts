import {
  botStartLink,
  DAY_MS,
  loopVia,
  momentLoop,
  type Moment,
  type ShareMoment,
} from '@platform/contracts';
import type { GrowthDeps, Side } from './ports';

// A moment is offered while it is fresh: right after it, never months later (docs/123).
const JOIN_FRESH_DAYS = 1;
const DRIVER_FRESH_DAYS = 7;

// The moment a person reached on a side while it is fresh; null: none now. No moment after a trip:
// the trip ends with the stars (owner decision 15.10.2026).
export async function reachedMoment(
  deps: GrowthDeps,
  userId: number,
  side: Side,
): Promise<ShareMoment | null> {
  const fresh = (at: number | null | undefined, days: number) =>
    at !== null && at !== undefined && deps.now() - at <= days * DAY_MS;
  if (side === 'passenger') return fresh(await deps.joinedAt(userId), JOIN_FRESH_DAYS) ? 'join' : null;
  return fresh(await deps.store.approvedAt(userId), DRIVER_FRESH_DAYS) ? 'driver' : null;
}

// The link of a moment's card: the start of the bot with the mark of the moment and the author's code.
export async function momentFacts(
  deps: GrowthDeps,
  userId: number,
  moment: ShareMoment | null,
): Promise<Moment> {
  const via = loopVia(moment ? momentLoop(moment) : 'share-join', await deps.store.codeOf(userId));
  return { moment, link: botStartLink(deps.passengerBot, via) };
}

// The moment a person reached and was not offered yet, with the link of its card.
export async function dueMoment(deps: GrowthDeps, userId: number, side: Side): Promise<Moment> {
  const [offered, found] = await Promise.all([deps.store.offered(userId), reachedMoment(deps, userId, side)]);
  return momentFacts(deps, userId, found && !offered.includes(found) ? found : null);
}
