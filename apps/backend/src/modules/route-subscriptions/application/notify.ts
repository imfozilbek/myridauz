import { canSendNow, fits, isActive, type Match } from '../domain/subscription';
import type { SubscriptionsDeps } from './ports';
import type { SubscriptionKind } from '@platform/contracts';

// A new trip or request: each fitting subscription hears about it now, or together with the
// others after the pause (docs/24).
export async function matchNew(deps: SubscriptionsDeps, kind: SubscriptionKind, match: Match): Promise<void> {
  const now = deps.now();
  const [live, placeMatches] = await Promise.all([deps.subscriptions.live(kind, now), deps.placeMatches()]);
  for (const subscription of live) {
    if (!isActive(subscription, now) || !fits(subscription, match, placeMatches)) continue;
    if (canSendNow(subscription, now)) {
      await deps.tell.one(subscription, match);
      await deps.subscriptions.save({ ...subscription, lastSentAt: now });
    } else await deps.subscriptions.save({ ...subscription, pending: subscription.pending + 1 });
  }
}

// A trip became cheaper (G39, docs/104, 9): the fitting passengers hear it at once. The trip itself
// keeps it to one message a day, so the pause of new matches does not hold it.
export async function matchCheaper(deps: SubscriptionsDeps, match: Match): Promise<void> {
  const now = deps.now();
  const [live, placeMatches] = await Promise.all([
    deps.subscriptions.live('trips', now),
    deps.placeMatches(),
  ]);
  for (const subscription of live)
    if (isActive(subscription, now) && fits(subscription, match, placeMatches))
      await deps.tell.cheaper(subscription, match);
}

// The Cron job (every 15 minutes): the waiting matches go in one message once the pause is over;
// "any date" that is over is offered to renew once (docs/24).
export async function sendWaiting(deps: SubscriptionsDeps): Promise<void> {
  const now = deps.now();
  for (const subscription of await deps.subscriptions.waiting()) {
    if (!canSendNow(subscription, now)) continue;
    if (isActive(subscription, now)) await deps.tell.many(subscription, subscription.pending);
    await deps.subscriptions.save({ ...subscription, pending: 0, lastSentAt: now });
  }
  for (const subscription of await deps.subscriptions.overdue(now)) {
    if (subscription.date === null) {
      await deps.tell.renew(subscription);
      await deps.subscriptions.save({ ...subscription, expired: true });
    } else await deps.subscriptions.remove(subscription.id);
  }
}
