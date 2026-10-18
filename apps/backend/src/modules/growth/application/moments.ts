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
const DRIVER_FRESH_DAYS = 7;

// The moment a person reached on a side while it is fresh; null: none now. No moment after a trip
// (owner decision 15.10.2026) and none after the registration (owner decision 18.10.2026): only a
// driver approved in the last days.
export async function reachedMoment(
  deps: GrowthDeps,
  userId: number,
  side: Side,
): Promise<ShareMoment | null> {
  if (side === 'passenger') return null;
  const approved = await deps.store.approvedAt(userId);
  return approved !== null && deps.now() - approved <= DRIVER_FRESH_DAYS * DAY_MS ? 'driver' : null;
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
