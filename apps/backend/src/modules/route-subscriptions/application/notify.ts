import type { SubscriptionKind } from '@platform/contracts';
import { fits, isActive, type Match, type SubscriptionRecord } from '../domain/subscription';
import type { SubscriptionsDeps } from './ports';

async function fitting(deps: SubscriptionsDeps, kind: SubscriptionKind, match: Match) {
  const now = deps.now();
  const [live, placeMatches] = await Promise.all([deps.subscriptions.live(kind, now), deps.placeMatches()]);
  return live.filter(
    (subscription: SubscriptionRecord) =>
      isActive(subscription, now) && fits(subscription, match, placeMatches),
  );
}

// A part of the fitting subscriptions: a big route is told part by part, so one task never holds the
// queue long (G86 T8). The whole list when no part is given. The answer: how many fit in all.
export type Part = { readonly from: number; readonly count: number };
const ALL: Part = { from: 0, count: Number.POSITIVE_INFINITY };
const partOf = <T>(list: readonly T[], part: Part) => list.slice(part.from, part.from + part.count);

// A new trip or request: each fitting subscription hears about it at once. The news card of the
// route rings once a day; the next news of the day edit it without sound (docs/122 rule 4).
// A request reaches only approved drivers, as the board does (G89 B17).
export async function matchNew(
  deps: SubscriptionsDeps,
  kind: SubscriptionKind,
  match: Match,
  part = ALL,
): Promise<number> {
  const all = await fitting(deps, kind, match);
  for (const subscription of partOf(all, part))
    if (kind === 'trips' || (await deps.approvedDriver(subscription.userId)))
      await deps.tell.one(subscription, match);
  return all.length;
}

// A trip became cheaper (G39, docs/104, 9): its line in the news card says so.
export async function matchCheaper(deps: SubscriptionsDeps, match: Match, part = ALL): Promise<number> {
  const all = await fitting(deps, 'trips', match);
  for (const subscription of partOf(all, part)) await deps.tell.cheaper(subscription, match);
  return all.length;
}

// The hourly Cron job: a dated subscription goes after its day; "any date" that is over is offered
// to renew once (docs/24), and not at all when the person renewed it in the same moment (G89).
export async function endOverdue(deps: SubscriptionsDeps): Promise<void> {
  for (const subscription of await deps.subscriptions.overdue(deps.now())) {
    if (subscription.date !== null) await deps.subscriptions.remove(subscription.id);
    else if (await deps.subscriptions.expire(subscription)) await deps.tell.renew(subscription);
  }
}
