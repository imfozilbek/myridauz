import {
  MAX_SUBSCRIPTIONS,
  type Subscription,
  type SubscriptionInput,
  type SubscriptionKind,
} from '@platform/contracts';
import { expiresAtOf, isActive, type SubscriptionRecord } from '../domain/subscription';
import type { Result, SubscriptionsDeps } from './ports';

const view = (subscription: SubscriptionRecord): Subscription => {
  const { id, kind, from, to, date, woman, expiresAt, expired } = subscription;
  return { id, kind, from, to, date, woman, expiresAt, expired };
};
const same = (a: SubscriptionInput, b: SubscriptionInput) =>
  a.from === b.from && a.to === b.to && a.date === b.date && a.woman === b.woman;

export async function mySubscriptions(deps: SubscriptionsDeps, userId: number, kind: SubscriptionKind) {
  const now = deps.now();
  const mine = await deps.subscriptions.byUser(userId, kind);
  // A dated subscription whose day is over is gone (docs/24).
  const kept = mine.filter((subscription) => subscription.date === null || subscription.expiresAt > now);
  // The live ones first, the stopped ones under them; the newest first inside each (G41, docs/90 F-P15).
  const stopped = (subscription: SubscriptionRecord) => Number(!isActive(subscription, now));
  return kept.sort((a, b) => stopped(a) - stopped(b) || b.createdAt - a.createdAt).map(view);
}

// "Xabar bering" (docs/24): at most MAX_SUBSCRIPTIONS live ones; the same route twice is one.
export async function subscribe(
  deps: SubscriptionsDeps,
  userId: number,
  kind: SubscriptionKind,
  input: SubscriptionInput,
): Promise<Result<Subscription, 'subscriptions.too_many'>> {
  const now = deps.now();
  const live = (await deps.subscriptions.byUser(userId, kind)).filter((known) => isActive(known, now));
  const twin = live.find((known) => same(known, input));
  if (twin) return { ok: true, value: view(twin) };
  if (live.length >= MAX_SUBSCRIPTIONS) return { ok: false, error: 'subscriptions.too_many' };
  const subscription: SubscriptionRecord = {
    ...input,
    // Only passengers look for "Mashinada ayol bor" (docs/06).
    woman: kind === 'trips' && input.woman,
    id: deps.newId(),
    userId,
    kind,
    expiresAt: expiresAtOf(input.date, now),
    expired: false,
    createdAt: now,
  };
  await deps.subscriptions.save(subscription);
  return { ok: true, value: view(subscription) };
}

async function own(deps: SubscriptionsDeps, userId: number, kind: SubscriptionKind, id: string) {
  const subscription = await deps.subscriptions.find(id);
  return subscription?.userId === userId && subscription.kind === kind ? subscription : undefined;
}

export async function unsubscribe(
  deps: SubscriptionsDeps,
  userId: number,
  kind: SubscriptionKind,
  id: string,
) {
  const subscription = await own(deps, userId, kind, id);
  if (subscription) await deps.subscriptions.remove(id);
  return subscription !== undefined;
}

// "Uzaytirish": an "any date" subscription lives ANY_DATE_DAYS more days (docs/24).
export async function renew(
  deps: SubscriptionsDeps,
  userId: number,
  kind: SubscriptionKind,
  id: string,
): Promise<Result<Subscription, 'subscriptions.not_found' | 'subscriptions.too_many'>> {
  const subscription = await own(deps, userId, kind, id);
  if (!subscription || subscription.date !== null) return { ok: false, error: 'subscriptions.not_found' };
  const now = deps.now();
  if (!isActive(subscription, now)) {
    const live = (await deps.subscriptions.byUser(userId, kind)).filter((known) => isActive(known, now));
    if (live.length >= MAX_SUBSCRIPTIONS) return { ok: false, error: 'subscriptions.too_many' };
  }
  const renewed = { ...subscription, expiresAt: expiresAtOf(null, now), expired: false };
  await deps.subscriptions.save(renewed);
  return { ok: true, value: view(renewed) };
}
