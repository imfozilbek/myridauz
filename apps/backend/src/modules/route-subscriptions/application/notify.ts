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

// A new trip or request: each fitting subscription hears about it at once. The news card of the
// route rings once a day; the next news of the day edit it without sound (docs/122 rule 4).
// A request reaches only approved drivers, as the board does (G89 B17).
export async function matchNew(deps: SubscriptionsDeps, kind: SubscriptionKind, match: Match): Promise<void> {
  for (const subscription of await fitting(deps, kind, match))
    if (kind === 'trips' || (await deps.approvedDriver(subscription.userId)))
      await deps.tell.one(subscription, match);
}

// A trip became cheaper (G39, docs/104, 9): its line in the news card says so.
export async function matchCheaper(deps: SubscriptionsDeps, match: Match): Promise<void> {
  for (const subscription of await fitting(deps, 'trips', match))
    await deps.tell.cheaper(subscription, match);
}

// The hourly Cron job: a dated subscription goes after its day; "any date" that is over is offered
// to renew once (docs/24), and not at all when the person renewed it in the same moment (G89).
export async function endOverdue(deps: SubscriptionsDeps): Promise<void> {
  for (const subscription of await deps.subscriptions.overdue(deps.now())) {
    if (subscription.date !== null) await deps.subscriptions.remove(subscription.id);
    else if (await deps.subscriptions.expire(subscription)) await deps.tell.renew(subscription);
  }
}
